## Autor : Kinga Kowalska

## Opis
W ramach zadania skonfigurowano zautomatyzowany łańcuch CI/CD przy użyciu GitHub Actions. Potok (pipeline) buduje obraz kontenera na podstawie kodu źródłowego aplikacji z Zadania 1, skanuje go pod kątem bezpieczeństwa, a na koniec publikuje w usłudze GitHub Container Registry (ghcr.io).

## Konfiguracja etapów CI/CD:

* **Wsparcie dla wielu architektur:** Dzięki wykorzystaniu akcji `docker/setup-qemu-action` oraz silnika BuildKit `docker/setup-buildx-action`, obraz budowany jest jednocześnie dla dwóch platform sprzętowych: `linux/amd64` oraz `linux/arm64`.
* **Zarządzanie Cache:** W celu znacznego skrócenia czasu kolejnych budowań, zaimplementowano mechanizm cache'owania. Wyniki pośrednie (warstwy) są wysyłane i pobierane do publicznego repozytorium na DockerHubie (wykorzystano backend `registry` oraz tryb `max`, który eksportuje wszystkie warstwy dla wszystkich etapów budowania).
* **Skanowanie podatności (CVE):** Zaimplementowano dwuetapowy proces budowania. Obraz najpierw jest budowany i ładowany tylko na architekturę domyślną, a następnie skanowany narzędziem **Trivy** (`aquasecurity/trivy-action`). Potok jest restrykcyjny – zwraca kod błędu (exit code 1) i natychmiast przerywa działanie, jeśli znajdzie podatności `CRITICAL` lub `HIGH`. Ukończenie tego etapu wymagało optymalizacji pliku `Dockerfile` (zastosowanie bezpiecznego obrazu bazowego `node:20-alpine` oraz wymuszenie aktualizacji wbudowanego środowiska `npm` przed instalacją zależności).

## Schemat tagowania obrazów i danych cache

**Tagowanie obrazów:**
Do zarządzania tagami obrazu użyto oficjalnego narzędzia `docker/metadata-action`. Zrezygnowano z ręcznego nadawania tagu `latest`. Skonfigurowano dwa schematy:
1. `type=sha, priority=100` - przy każdym commicie i wysłaniu kodu na gałąź `main`.
2. `type=semver, priority=200` - w momencie opublikowania oficjalnego tagu  w Git.

**Tagowanie cache:**
Dane cache tagowane są w sposób statyczny w dedykowanym repozytorium (np. pod tagiem `:cache`), co pozwala na łatwe ich nadpisywanie w trybie `max`.

## Uzasadnienie wyboru
Wybór schematu oparty jest na dobrych praktykach oraz zaleceniach z oficjalnej dokumentacji.
Podejście wieloschematowe (sha + semver) pozwala na precyzyjną identyfikację, z jakiego konkretnie kodu (commit) powstał obraz, a przypisanie odpowiednich priorytetów automatycznie zarządza tym, który tag jest główny przy danym wyzwalaczu (event). Zastosowanie trybu `registry` i `mode=max` dla cache jest z kolei rekomendowanym sposobem w oficjalnej dokumentacji Dockera na przesyłanie wszystkich warstw budowania do zewnętrznego, publicznego rejestru.

## Źródła 

[1] *Dokumentacja schematów tagowania i wyzwalaczy:* https://github.com/marketplace/actions/docker-metadata-action#usage


[2] *Dokumentacja priorytetów tagowania:* https://github.com/marketplace/actions/docker-metadata-action#priority-attribute


[3] *Dokumentacja wykorzystania cache z GitHub Actions:* https://docs.docker.com/build/ci/github-actions/cache/
