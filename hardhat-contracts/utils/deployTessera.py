# ESTE ARCHIVO NO ES NECESARIO, SOLO CORRER SI OCURREN PROBLEMAS CON TESSERA

import json
import os
import string
import subprocess
from pathlib import Path

try:
    import yaml            
except ImportError as exc:  
    raise SystemExit("PyYAML is required:  pip install pyyaml") from exc


ROOT              = Path(__file__).resolve().parents[2]
NODES_BASE        = ROOT / "interbank-blockchain" / "data"
BASE_PORT_BLOCK   = 9_000           
COMPOSE_FILENAME  = ROOT / "docker-compose-tessera.yml"


def numeric_subdirs(path: Path) -> list[int]:
    """Return all sub-directories whose names are only digits, sorted asc."""
    return sorted(
        int(p.name) for p in path.iterdir() if p.is_dir() and p.name.isdigit()
    )


def docker_keygen(node_dir: Path) -> None:
    """Run Tessera keygen inside *node_dir* (keys appear as nodeKey.*)."""
    cmd = [
        "docker", "run", "--rm",
        "-v", f"{node_dir}:/tessera/keys",
        "quorumengineering/tessera:latest",
        "tessera", "-keygen", "-filename", "/tessera/keys/nodeKey",
    ]
    subprocess.run(cmd, check=True)


def tessera_conf_json(i: int, total_nodes: list[int]) -> dict:
    """Create the JSON object for tessera.conf of node *i*."""
    base_port = BASE_PORT_BLOCK + i * 100
    p1, p2, p3 = base_port + 1, base_port + 2, base_port + 3
    letter     = string.ascii_lowercase[i - 1]
    name       = f"tessera-{letter}"

    peer_urls = [
        {
            "url": f"http://tessera-{string.ascii_lowercase[j-1]}:"
                   f"{BASE_PORT_BLOCK + j*100 + 3}"
        }
        for j in total_nodes if j != i
    ]

    return {
        "mode": "orion",
        "useWhiteList": False,
        "jdbc": {
            "username": "sa",
            "password": "",
            "url":      f"jdbc:h2:./target/h2/tessera{i}",
            "autoCreateTables": True,
        },
        "serverConfigs": [
            {"app": "ThirdParty", "serverAddress": f"http://0.0.0.0:{p1}",
             "communicationType": "REST"},
            {"app": "Q2T",        "serverAddress": f"http://0.0.0.0:{p2}",
             "communicationType": "REST"},
            {"app": "P2P",
             "serverAddress": f"http://{name}:{p3}",
             "communicationType": "REST",
             "sslConfig": {"tls": "OFF"}},
        ],
        "peer": peer_urls,
        "keys": {
            "passwords": [],
            "keyData": [
                {"privateKeyPath": "nodeKey.key",
                 "publicKeyPath":  "nodeKey.pub"}
            ],
        },
        "alwaysSendTo": [],
    }


def compose_service(i: int) -> tuple[str, dict]:
    """Return (<service-name>, <dict for docker-compose>) for node *i*."""
    base_port = BASE_PORT_BLOCK + i * 100
    p1, p2, p3 = base_port + 1, base_port + 2, base_port + 3
    letter     = string.ascii_lowercase[i - 1]
    name       = f"tessera-{letter}"

    service_def = {
        "image":          "quorumengineering/tessera:23.4",
        "container_name": name,
        "hostname":       name,
        "working_dir":    "/config",
        "volumes":        [f"./config/nodes/{i}:/Tessera/config"],
        "entrypoint":     ["/tessera/bin/tessera"],
        "command":        ["--configfile", "tessera.conf"],
        "networks":       {"besu-network": {"ipv4_address": f"172.20.0.{10+i}"}},
        "ports":          [f"{p1}:{p1}", f"{p2}:{p2}", f"{p3}:{p3}"],
    }
    return name, service_def


def main() -> None:
    node_ids = numeric_subdirs(NODES_BASE)
    if not node_ids:
        raise SystemExit(f"No numeric folders found under {NODES_BASE}")

    compose_services: dict[str, dict] = {}

    for i in node_ids:
        node_dir = NODES_BASE / str(i) / "Tessera"      # instead of ... /str(i)
        node_dir.mkdir(parents=True, exist_ok=True)

        print(f"[*] Node {i}: generating keys …")
        docker_keygen(node_dir)

        print(f"[*] Node {i}: writing tessera.conf")
        conf = tessera_conf_json(i, node_ids)
        (node_dir / "tessera.conf").write_text(
            json.dumps(conf, indent=2), encoding="utf-8"
        )

        print(f"[*] Node {i}: adding Compose service definition")
        service_name, service_def = compose_service(i)
        compose_services[service_name] = service_def

    compose_dict = {
        "version":  "3.8",
        "services": compose_services,
        "networks": {
            "besu-network": {
                "driver": "bridge",
                "ipam": {
                    "config": [{"subnet": "172.20.0.0/16"}]
                },
            }
        },
    }

    print(f"[+] Writing {COMPOSE_FILENAME}")
    COMPOSE_FILENAME.write_text(
        yaml.safe_dump(compose_dict, sort_keys=False),
        encoding="utf-8",
    )
    print("[+] All done.")


if __name__ == "__main__":
    main()
