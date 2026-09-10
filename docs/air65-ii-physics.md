# BETAFPV Air65 II Freestyle – Physikprofil

Das Profil ist eine **physikalisch plausible Annäherung**, keine behauptete
Messreplik. Es verwendet ausschließlich SI-Einheiten und die Freestyle-Version.

## Quellenstatus und Parameter

| Parameter               |                     Wert | Status               | Begründung                                                                                      |
| ----------------------- | -----------------------: | -------------------- | ----------------------------------------------------------------------------------------------- |
| Rahmenmasse ohne Akku   |                   17,8 g | Herstellerangabe     | Air65 II Freestyle                                                                              |
| Wheelbase               |                    65 mm | Herstellerangabe     | diagonaler Abstand gegenüberliegender Motorachsen, nicht Rahmenbreite                           |
| Motoren                 | 4 × 0702SE II, 25.000 KV | Herstellerangabe     | KV ist keine Schubangabe                                                                        |
| Propeller               |      GF 1219S, Dreiblatt | Herstellerangabe     | mit Propellerschutz                                                                             |
| Akku                    |       LAVA II 1S 320 mAh | Herstellerempfehlung | 320 mAh als Standard gewählt                                                                    |
| Akkumasse               |                    7,2 g | vorläufige Annahme   | austauschbar; verifizierte Herstellerangabe war nicht zugänglich                                |
| Abflugmasse             |                   25,0 g | abgeleitet           | 17,8 g + 7,2 g                                                                                  |
| Motorarm X/Z            |                 22,98 mm | abgeleitet           | `65 mm / (2·√2)` für X-Geometrie                                                                |
| Trägheit Roll/Pitch/Yaw |  8,1 / 8,1 / 14,5 µkg·m² | abgeleitet           | Punktmassen an Motorachsen, flache Rahmenmasse und zentraler Akku; Schwerpunktversatz unbekannt |
| Maximalschub            |            1,15 N gesamt | Tuning-Annahme       | ausdrücklich nicht von einer anderen Variante übernommen; Schubstandmessung fehlt               |
| Schubexponent           |                     1,78 | Tuning-Annahme       | editierbare nichtlineare Näherung                                                               |
| Motor-Zeitkonstanten    |     28/18 ms hoch/runter | Tuning-Annahme       | KV bestimmt diese nicht                                                                         |
| Kamerawinkel            |                      25° | Tuning-Annahme       | innerhalb des Herstellerbereichs 15–45°, von Physik getrennt                                    |

Herstellerreferenz: <https://betafpv.com/products/air65-ii-brushless-whoop-quadcopter>.
Die dort verlinkte Freestyle-CLI war in der Entwicklungsumgebung nicht
zuverlässig abrufbar. Deshalb wurden keine Betaflight-PIDs kopiert und eine
editierbare kubische Expo mit 750°/s Roll/Pitch sowie 500°/s Yaw angenommen.

## Modell

Jeder Motor besitzt ein eigenes Signal, eine asymmetrische Verzögerung, einen
Schub und einen Angriffspunkt. Die Hebelarme erzeugen Roll/Pitch; wechselnde
Drehrichtungen erzeugen Yaw-Reaktionsmomente. Der Acro-Ratenregler mischt seine
Ausgabe in die vier Motoren. Sättigung begrenzt echte Regelreserve; bedingte
Integration und schnelles Rückführen verhindern Windup. Es gibt keine
Horizontausrichtung, Höhenhaltung oder versteckte Bewegungshilfe.

Der 1S-Akku hat einen linearen Leerlaufspannungsverlauf, ohmschen Lastabfall,
eine Erholungszeit und Coulomb-Zählung. Der angenommene Maximalstrom und
Innenwiderstand sind bewusst einfach und müssen anhand von Logs ersetzt werden.
Körper- und rotordrehzahlabhängiger Widerstand wirken quadratisch relativ zur
ruhenden Luft in lokalen Achsen. Bodeneffekt und Propwash bleiben deaktiviert,
weil belastbare Referenzmessungen fehlen.

## Reproduzierbare Prüfungen

`Air65Physics.test.ts` prüft statisch Schub = Gewicht am berechneten
Schwebepunkt, einen Gassprung, Lastspannung/Ladezustand sowie dieselbe
Eingabesequenz bei 30, 60 und 144 Render-FPS mit 240-Hz-Physik. Diese Tests
belegen Modellkonsistenz, **nicht** die Übereinstimmung mit einem realen Air65.

Für höhere Genauigkeit werden vor allem benötigt: gemessenes Abfluggewicht des
konkreten 320-mAh-Setups, Motor/Prop-Schubkurve über Spannung, vollständiger
Freestyle-CLI-Dump sowie Blackbox-Logs von Ratesprüngen, Punch-out, Abfangen und
Ausrollen.
