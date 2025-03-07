#!/usr/bin/env python3
"""One-time runtime secret and schema setup. Never calls AI or search APIs."""
import json, pathlib, secrets, subprocess
from remote import connection
ROOT=pathlib.Path(__file__).resolve().parents[2]
private=ROOT/'.deploy-private';private.mkdir(mode=0o700,exist_ok=True)
password_file=private/'postgres-password'
if not password_file.exists():
    password_file.write_text(secrets.token_hex(32));password_file.chmod(0o600)
password=password_file.read_text().strip()
# Parse env with the same dotenv parser as the application; never print values.
env=json.loads(subprocess.run(['node','-e',"const fs=require('fs');process.stdout.write(JSON.stringify(require('dotenv').parse(fs.readFileSync('.env.local'))))"],cwd=ROOT,capture_output=True,text=True,check=True).stdout)
for key in ['OPENAI_API_KEY']:
    if not env.get(key): raise SystemExit('Missing '+key)
def secret(name, data):
    return {'apiVersion':'v1','kind':'Secret','metadata':{'name':name,'namespace':'candidstance'},'type':'Opaque','stringData':data}
items=[secret('postgres-secrets',{'POSTGRES_USER':'candidstance','POSTGRES_DB':'candidstance','POSTGRES_PASSWORD':password}),secret('candidstance-secrets',{'DATABASE_URL':'postgresql://candidstance:'+password+'@postgres:5432/candidstance','DATABASE_SSL':'false','OPENAI_API_KEY':env['OPENAI_API_KEY']}),{'apiVersion':'v1','kind':'ConfigMap','metadata':{'name':'postgres-schema','namespace':'candidstance'},'data':{'schema.sql':(ROOT/'lib/database/schema.sql').read_text()}}]
with connection() as ssh:
    subprocess.run(ssh+['sudo k3s kubectl create namespace candidstance --dry-run=client -o yaml | sudo k3s kubectl apply -f -'],check=True)
    subprocess.run(ssh+['sudo k3s kubectl apply -f -'],input=json.dumps({'apiVersion':'v1','kind':'List','items':items}),text=True,check=True)
print('Runtime secrets and database schema installed; no API requests were made.')
