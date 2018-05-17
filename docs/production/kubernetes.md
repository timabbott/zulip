# Setting up a Kubernetes cluster with helm

The specific instructions are for Linux; see the links for full
documentation.

1. [Install kubectl](https://kubernetes.io/docs/tasks/tools/install-kubectl/)
```
curl -s https://packages.cloud.google.com/apt/doc/apt-key.gpg | apt-key add -
cat <<EOF >/etc/apt/sources.list.d/kubernetes.list
deb http://apt.kubernetes.io/ kubernetes-xenial main
EOF
apt-get update
apt-get install -y kubectl
```

1. [Install minikube][minikube] through `minikube start`.  On Linux, this is:
```
curl -Lo minikube https://storage.googleapis.com/minikube/releases/v0.27.0/minikube-linux-amd64
chmod +x minikube
sudo mv minikube /usr/local/bin/
```

1. Setup a [minikube container runtime](https://kubernetes.io/docs/getting-started-guides/minikube/):
```
sudo apt install libvirt-bin qemu-kvm
sudo usermod -a -G libvirtd $(whoami)
newgrp libvirtd
curl -LO https://storage.googleapis.com/minikube/releases/latest/docker-machine-driver-kvm2 && chmod +x docker-machine-driver-kvm2 && sudo mv docker-machine-driver-kvm2 /usr/local/bin/
minikube start --vm-driver kvm2
```

[minikube]: https://github.com/kubernetes/minikube/releases

1. [Install helm](https://docs.helm.sh/using_helm/#installing-helm)

```
https://storage.googleapis.com/kubernetes-helm/helm-v2.9.1-linux-amd64.tar.gz
tar -xf helm-*.tar.gz
sudo mv linux-amd64/helm /usr/local/bin
helm init --upgrade
```

1. Get the Zulip Helm Chart and use it!
```
git clone https://github.com/armooo/zulip-helm
helm dependency build
helm install .
```

TODO: Investigate what Helm security advice we should give.

Now go and setup DNS for your IP; you can get the IP via:

```
kubectl get ingress
```
