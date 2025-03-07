#!/usr/bin/env python3
"""Run commands via short-lived Lightsail SSH credentials, verifying AWS host keys.
Opens SSH only to the current caller's IP, then removes that temporary rule.
No SSH private keys are stored in GitHub, CodeBuild or the repository.
"""
import contextlib, ipaddress, json, os, pathlib, subprocess, tempfile, time, urllib.request
REGION = os.environ.get('AWS_DEFAULT_REGION', 'us-east-1')
INSTANCE = os.environ.get('LIGHTSAIL_INSTANCE', 'candidstance-k3s')
def aws(*args):
    result = subprocess.run(['aws', *args, '--region', REGION, '--output', 'json'], check=True, capture_output=True, text=True)
    return json.loads(result.stdout or '{}')
@contextlib.contextmanager
def connection():
    ip = str(ipaddress.ip_address(urllib.request.urlopen('https://checkip.amazonaws.com', timeout=15).read().decode().strip()))
    rule = {'fromPort':22,'toPort':22,'protocol':'tcp','cidrs':[ip+'/32']}
    existing = aws('lightsail','get-instance-port-states','--instance-name',INSTANCE)['portStates']
    already = any(x.get('fromPort')==22 and ip+'/32' in x.get('cidrs',[]) for x in existing)
    if not already: aws('lightsail','open-instance-public-ports','--instance-name',INSTANCE,'--port-info',json.dumps(rule))
    try:
        details=aws('lightsail','get-instance-access-details','--instance-name',INSTANCE,'--protocol','ssh')['accessDetails']
        with tempfile.TemporaryDirectory(prefix='candidstance-ssh-') as tmp:
            folder=pathlib.Path(tmp); key=folder/'key'; cert=folder/'key-cert.pub'; hosts=folder/'known_hosts'
            key.write_text(details['privateKey']); key.chmod(0o600)
            cert.write_text(details['certKey']); cert.chmod(0o600)
            entries=[]
            for host in details.get('hostKeys',[]):
                pub=host['publicKey']
                if not pub.startswith(('ssh-', 'ecdsa-')): pub=host['algorithm']+' '+pub
                entries.append(details['ipAddress']+' '+pub)
            pin=pathlib.Path(__file__).with_name('known_hosts')
            if pin.exists():
                entries=pin.read_text().strip().splitlines()
            elif not entries and os.environ.get('BOOTSTRAP_TRUST_HOST')=='1':
                scan=subprocess.run(['ssh-keyscan','-T','15','-t','ed25519',details['ipAddress']],capture_output=True,text=True,check=True)
                entries=scan.stdout.strip().splitlines()
                if entries: pin.write_text('\n'.join(entries)+'\n')
            if not entries: raise RuntimeError('No pinned host key. Bootstrap once from the authorized operator machine.')
            hosts.write_text('\n'.join(entries)+'\n')
            base=['ssh','-i',str(key),'-o','IdentitiesOnly=yes','-o','StrictHostKeyChecking=yes','-o','UserKnownHostsFile='+str(hosts),'-o','ConnectTimeout=15',details['username']+'@'+details['ipAddress']]
            yield base
    finally:
        if not already: aws('lightsail','close-instance-public-ports','--instance-name',INSTANCE,'--port-info',json.dumps(rule))
if __name__=='__main__':
    import sys
    with connection() as ssh:
        subprocess.run(ssh+[sys.argv[1] if len(sys.argv)>1 else 'sudo k3s kubectl get pods -A'],check=True)
