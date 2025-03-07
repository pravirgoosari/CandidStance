#!/bin/bash
set -eu
export DEBIAN_FRONTEND=noninteractive
apt-get update
apt-get install -y curl ca-certificates openssl python3
install -d -m 700 /etc/rancher/k3s
cat > /etc/rancher/k3s/config.yaml <<'YAML'
secrets-encryption: true
write-kubeconfig-mode: "0600"
disable:
  - metrics-server
kubelet-arg:
  - "image-gc-high-threshold=70"
  - "image-gc-low-threshold=50"
YAML
curl -fsSL https://get.k3s.io -o /root/install-k3s.sh
INSTALL_K3S_VERSION=v1.36.4+k3s1 sh /root/install-k3s.sh
install -d -m 700 /opt/candidstance /opt/candidstance/backups
mkdir -p /etc/systemd/journald.conf.d
printf '[Journal]\nSystemMaxUse=100M\n' > /etc/systemd/journald.conf.d/candidstance.conf
systemctl restart systemd-journald
