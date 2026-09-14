# Helmflow

> **Project status — archived direction.** Helmflow originally aimed to provide a proprietary working environment for multiple agents. After evaluating existing solutions, we changed the build-vs-adopt decision: the planned Helmflow MVP/platform and related experiments are no longer an active development direction. We are adopting [Orca](https://www.onorca.dev/) for execution and work visibility, [Dely](https://github.com/hieuphung97/dely) for the delivery and review process, and [Superpowers](https://github.com/obra/superpowers) for working methodology. Defining roles and workflows and integrating these tools are separate configuration and integration work, not a complete replacement for every Helmflow capability. The documentation and prototypes remain historical material and reference requirements, not a production solution.

Helmflow to **SDK, silnik i platforma kontrolowanego SDLC prowadzonego przez agentów**: właściciel projektu utrwala swoją wiedzę w wersjonowanych agentach i paczkach wiedzy, agenci wykonują kolejne etapy procesu (analiza → architektura → implementacja → testy → review) w izolowanych sandboxach, a każda zmiana, przekazanie pracy i decyzja człowieka zostawia pełny, niezależny od agenta ślad. Drugi równorzędny przypadek użycia: **rozumienie** nieznanego programu — rekonstrukcja jego modelu domeny, danych i architektury z dowodami w kodzie.

**Status:** faza dokumentacji, przed implementacją MVP.

- Dokumentacja produktowa: [docs/README.md](docs/README.md)
- Decyzje wiążące: [docs/decyzje.md](docs/decyzje.md)
- Plan MVP: [docs/plan-mvp.md](docs/plan-mvp.md)

Licencja: [AGPL-3.0-only](LICENSE).
