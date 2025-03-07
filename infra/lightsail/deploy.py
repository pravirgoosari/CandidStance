#!/usr/bin/env python3
"""Deploy a commit-tagged ECR image; health checks never call paid search APIs."""
import base64, json, os, pathlib, re, shlex, subprocess
from remote import aws, connection
ROOT=pathlib.Path(__file__).resolve().parents[2]
image=os.environ['DEPLOY_IMAGE']
if not re.fullmatch(r'[0-9]+\.dkr\.ecr\.[a-z0-9-]+\.amazonaws\.com/candidstance-app:[a-f0-9]{7,40}',image):
    raise SystemExit('Expected an immutable commit-tagged candidstance ECR image')
auth=aws('ecr','get-authorization-token')['authorizationData'][0]
registry=auth['proxyEndpoint'].removeprefix('https://')
secret={'apiVersion':'v1','kind':'Secret','metadata':{'name':'ecr-pull','namespace':'candidstance'},'type':'kubernetes.io/dockerconfigjson','data':{'.dockerconfigjson':base64.b64encode(json.dumps({'auths':{registry:{'auth':auth['authorizationToken']}}}).encode()).decode()}}
manifest=(ROOT/'infra/lightsail/k8s.yaml').read_text().replace('CANDIDSTANCE_IMAGE',image)
with connection() as ssh:
    def run(command, data=None, capture=False):
        return subprocess.run(ssh+[command],input=data,text=True,check=True,capture_output=capture)
    run('sudo k3s kubectl apply -f -',json.dumps(secret))
    previous=run("sudo k3s kubectl -n candidstance get deployment candidstance-app -o jsonpath='{.spec.template.spec.containers[0].image}' 2>/dev/null || true",capture=True).stdout
    run('sudo k3s kubectl apply -f -',manifest)
    try:
        run('sudo k3s kubectl -n candidstance rollout status statefulset/postgres --timeout=180s')
        run('sudo k3s kubectl -n candidstance rollout status deployment/candidstance-app --timeout=180s')
        run("curl -fsS --retry 5 --retry-delay 2 -H 'Host: candidstance.ai' http://127.0.0.1/api/health")
    except subprocess.CalledProcessError:
        if previous:
            run('sudo k3s kubectl -n candidstance set image deployment/candidstance-app candidstance-app='+shlex.quote(previous))
            run('sudo k3s kubectl -n candidstance rollout status deployment/candidstance-app --timeout=180s')
        raise
print('Deployed '+image)
