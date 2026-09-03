# Einstellungen im Menü „Drohne Tunen“

Das Menü **Drohne Tunen** verändert das physikalische Modell und den
Flugregler der simulierten AIR65 unmittelbar. Die Werte werden im Browser
gespeichert und beim nächsten Start wieder geladen. Mit **Werkseinstellung**
werden alle Regler auf das AIR65-Standardprofil zurückgesetzt.

> **Tipp:** Immer nur einen Wert in kleinen Schritten ändern und anschließend
> Schwebeflug, schnelle Richtungswechsel sowie Abfangmanöver testen. Mehr ist
> nicht automatisch besser: Extreme Werte können zu Überschwingen, trägen
> Reaktionen oder einem kaum kontrollierbaren Modell führen.

## Gewicht und Schub

### Gewicht (15–50 g)

Die flugfertige Gesamtmasse der Drohne. Ein höheres Gewicht erhöht die
Gewichtskraft und die Trägheit der linearen Bewegung, während der verfügbare
Maximalschub gleich bleibt.

- **Höher:** Der Schwebepunkt steigt, Steigflüge und Abfangen benötigen mehr
  Gas. Die Drohne hält ihren Bewegungszustand stärker und fühlt sich weniger
  „floaty“ an.
- **Niedriger:** Der Schwebepunkt sinkt; die Drohne beschleunigt und steigt mit
  demselben Gas stärker.

Das Menü ändert dabei nicht die separat modellierten Drehträgheitsmomente. Eine
Gewichtsänderung allein macht die Drehbewegung daher nicht automatisch träger.

### Max. Schub (0,4–2,5 N)

Der maximale **Gesamtschub aller vier Motoren** bei Vollgas. Der momentane
Schub ergibt sich vereinfacht aus
`Max. Schub × Motorgas^Schub-Exponent`.

- **Höher:** Niedrigerer Schwebepunkt, kräftigere Steigflüge und mehr Reserve
  zum Abfangen.
- **Niedriger:** Höherer Schwebepunkt und weniger vertikale Autorität. Liegt
  der Maximalschub zu nah an der Gewichtskraft, kann die Drohne kaum oder gar
  nicht steigen.

### Schub-Exponent (1,00–2,50)

Bestimmt die Krümmung der Gaskurve zwischen 0 % und 100 %. Vollgas bleibt vom
Exponenten unbeeinflusst, mittlere Gasstellungen dagegen nicht.

- **Höher:** Bei gleichem mittleren Stickwert entsteht weniger Schub. Der
  Schwebepunkt wandert nach oben; der untere Gasbereich wird feiner, der obere
  Bereich kräftiger komprimiert.
- **Niedriger (Richtung 1):** Die Schubabgabe wird linearer, der Schwebepunkt
  sinkt und mittlere Gaswerte wirken direkter.

### Schwebepunkt (Anzeige)

Der Schwebepunkt ist kein eigener Regler, sondern eine berechnete Orientierung:
der Gaswert, bei dem Schub und Gewichtskraft bei waagerechter, ruhender Drohne
gleich groß sind. Zielbereich des Standardmodells sind ungefähr **20–30 %**.
Neigung, Bewegung und Luftwiderstand können den tatsächlich erforderlichen
Gaswert verändern.

## Motorreaktion

### Spool-up (10–150 ms)

Zeitkonstante dafür, wie schnell der simulierte Motor einer **Gaserhöhung**
folgt. Es handelt sich nicht um eine feste Verzögerung: Der Schub nähert sich
dem Zielwert kontinuierlich an.

- **Höher:** Sanftere, aber verzögerte Gasannahme; Abfangen und Punch-outs
  reagieren träger.
- **Niedriger:** Unmittelbarere, härtere Gasannahme und präzisere schnelle
  Höhenkorrekturen.

### Spool-down (5–100 ms)

Zeitkonstante dafür, wie schnell der Motor einer **Gasreduzierung** folgt.

- **Höher:** Der Schub bleibt nach dem Zurücknehmen länger erhalten. Die Drohne
  sinkt später und wirkt beim Gaswegnehmen schwebender.
- **Niedriger:** Der Schub fällt schneller ab; Sinkflug und schnelle
  Höhenwechsel setzen direkter ein.

Spool-up und Spool-down sind getrennt, damit Hoch- und Herunterdrehen der
Motoren unterschiedlich dynamisch abgestimmt werden können.

## Aerodynamischer Widerstand

Die Körper-Drag-Werte wirken quadratisch zur Geschwindigkeit in den **lokalen
Drohnenachsen**: X und Z liegen seitlich in der Rahmenebene, Y zeigt senkrecht
durch die Drohne. Der Widerstand wächst dadurch bei hohem Tempo besonders
stark.

### Körper-Drag X (0,000–0,100)

Luftwiderstand entlang der lokalen X-Achse.

- **Höher:** Bewegung in dieser horizontalen Körperrichtung wird stärker
  gebremst; die Drohne erreicht weniger Tempo und kommt nach einer Neigung
  schneller zur Ruhe.
- **Niedriger:** Mehr Gleitweg, höhere Geschwindigkeit und weniger
  aerodynamische Abbremsung auf dieser Achse.

### Körper-Drag Y (0,000–0,100)

Luftwiderstand entlang der lokalen Hochachse, also bei waagerechter Drohne vor
allem im Steigen und Sinken.

- **Höher:** Vertikale Geschwindigkeit wird stärker begrenzt; schnelle
  Steig- und Sinkflüge werden deutlicher gebremst.
- **Niedriger:** Freierer, schnellerer Sinkflug und weniger Widerstand beim
  Steigen.

### Körper-Drag Z (0,000–0,100)

Luftwiderstand entlang der lokalen Z-Achse. Die Wirkung entspricht
**Körper-Drag X**, jedoch in der dazu rechtwinkligen horizontalen
Körperrichtung. Unterschiedliche X- und Z-Werte erzeugen entsprechend
unterschiedliches Gleit- und Bremsverhalten je nach Flugrichtung.

### Rotor-Drag lateral (0,000–0,100)

Zusätzlicher quadratischer Widerstand in den lokalen X- und Z-Richtungen durch
Propeller und Ducts. Er wird mit der aktuellen Motordrehzahl skaliert.

- **Höher:** Bei laufenden Motoren wird seitliche Bewegung stärker gedämpft;
  Kurven fühlen sich „eingehakter“ an und die Drohne driftet weniger lange.
- **Niedriger:** Mehr seitliches Gleiten und längeres Auslaufen.

Bei sehr wenig Gas nimmt dieser Zusatzwiderstand ab. Der vertikale Widerstand
Y wird von dieser Einstellung nicht verändert.

### Angularer Drag (0,00–1,00)

Dämpft die Winkelgeschwindigkeit des gesamten Körpers unabhängig vom
PID-Regler.

- **Höher:** Drehungen verlieren schneller Energie. Das Modell wirkt ruhiger,
  benötigt aber mehr Reglerkraft und kann weniger frei rotieren.
- **Niedriger:** Drehbewegungen laufen länger aus und fühlen sich freier an;
  der Flugregler muss sie aktiver stoppen.

## Stick-Kurve und maximale Drehraten

### Rate Expo (0,00–1,00)

Formt Roll-, Pitch- und Yaw-Eingaben mit einer Mischung aus linearer und
kubischer Kurve. Die maximale Drehrate bei vollem Stick bleibt gleich.

- **Höher:** Weniger Empfindlichkeit um die Stickmitte für feinere
  Korrekturen, dafür ein steilerer Anstieg nahe den Endausschlägen.
- **Niedriger:** Gleichmäßigere, bei 0 vollständig lineare Reaktion; kleine
  Stickbewegungen erzeugen mehr Drehrate.

### Roll Rate (1,0–25,0 rad/s)

Maximale Soll-Drehrate um die Rollachse bei vollem Stick. Ein höherer Wert
ermöglicht schnellere Flips bzw. Rollen, macht große Ausschläge aber
empfindlicher. Ein niedriger Wert sorgt für langsamere, besser dosierbare
Rollbewegungen. Als Orientierung entsprechen 12 rad/s ungefähr 688 °/s.

### Pitch Rate (1,0–25,0 rad/s)

Maximale Soll-Drehrate um die Pitchachse bei vollem Stick. Höhere Werte
ermöglichen schnellere Vorwärts- und Rückwärtsflips; niedrigere Werte machen
diese Bewegungen ruhiger. Als Orientierung entsprechen 12 rad/s ungefähr
688 °/s.

### Yaw Rate (1,0–20,0 rad/s)

Maximale Soll-Drehrate um die Hochachse bei vollem Yaw-Stick. Höhere Werte
drehen die Flugrichtung schneller, niedrigere Werte erleichtern fein dosierte
Kurskorrekturen. Als Orientierung entsprechen 8 rad/s ungefähr 458 °/s.

Die Rate-Werte sind Sollwerte. Ob sie tatsächlich erreicht werden, hängt unter
anderem von PID-Abstimmung, angularer Dämpfung und dem intern begrenzten
maximalen Drehmoment ab.

## PID-Ratenregler

Der PID-Regler vergleicht auf jeder Drehachse die gewünschte mit der
tatsächlichen Drehrate und erzeugt daraus ein Drehmoment. Die drei Werte wirken
gemeinsam auf Roll, Pitch und Yaw. Zu hohe Verstärkungen können Schwingen oder
ruckartige Reaktionen verursachen; zu niedrige Werte führen dazu, dass die
Drohne dem Stickbefehl nur langsam oder ungenau folgt.

### PID · P (0,00000–0,00100)

Der proportionale Anteil reagiert direkt auf den aktuellen Ratenfehler.

- **Höher:** Direkteres Einlenken und stärkeres Halten der Sollrate, aber mehr
  Überschwingen oder schnelle Oszillation bei zu hohem Wert.
- **Niedriger:** Weicheres, jedoch trägeres und unpräziseres Folgen der
  Stickbefehle.

### PID · I (0,000000–0,000200)

Der integrale Anteil summiert einen länger bestehenden Ratenfehler auf. Er
hilft, dauerhafte Abweichungen gegen Störeinflüsse auszugleichen.

- **Höher:** Besseres Halten der angeforderten Bewegung unter anhaltender
  Belastung, kann aber langsames Nachschwingen oder ein „festgehaltenes“ Gefühl
  verursachen.
- **Niedriger:** Weniger Nachwirkung, dafür können konstante Fehler länger
  bestehen bleiben.

Die aufsummierte Abweichung ist intern begrenzt, damit sie nicht unbegrenzt
anwächst.

### PID · D (0,000000–0,000020)

Der differentielle Anteil reagiert darauf, wie schnell sich der Ratenfehler
ändert. Er wirkt vorausschauend dämpfend auf schnelle Änderungen.

- **Höher:** Weniger Überschwingen und schärferes Abstoppen, bei zu hohem Wert
  jedoch nervöse Reaktionen oder hochfrequentes Zittern.
- **Niedriger:** Glattere, aber möglicherweise stärker überschwingende
  Reaktion beim Einlenken und Stoppen.

## Empfohlene Abstimmreihenfolge

1. **Gewicht, Max. Schub und Schub-Exponent** so einstellen, dass Leistung und
   angezeigter Schwebepunkt plausibel sind.
2. Mit **Spool-up/-down** die gewünschte Gasreaktion festlegen.
3. **Körper-, Rotor- und angularen Drag** anhand von Gleitflug, Sinkflug und
   Abstoppen abstimmen.
4. **Roll-, Pitch- und Yaw Rate** für die gewünschte maximale Agilität wählen
   und danach mit **Rate Expo** die Stickmitte dosierbar machen.
5. Erst anschließend **P**, **I** und **D** in kleinen Schritten abstimmen und
   sowohl kurze Impulse als auch länger gehaltene Manöver testen.
