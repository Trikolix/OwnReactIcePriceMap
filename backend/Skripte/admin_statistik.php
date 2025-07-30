<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="UTF-8" />
  <title>Ice-App Statistiken</title>
  <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/chartjs-plugin-datalabels@2.0.0"></script>
  <style>
    canvas {
      max-width: 1000px;
      height: 400px;
      margin: 2rem auto;
      display: block;
    }
    body {
      font-family: sans-serif;
      max-width: 1000px;
      margin: auto;
    }
    h2 {
      text-align: center;
      margin-top: 2rem;
    }
  </style>
</head>
<body>
  <h2>📊 Ice-App Statistiken</h2>
  <canvas id="chartNeueNutzer"></canvas>
  <canvas id="chartCheckins"></canvas>
  <canvas id="chartAktiveNutzer"></canvas>
  <canvas id="chartGesamtEisdielen"></canvas>
  <canvas id="chartGesamtCheckins"></canvas>
  <canvas id="chartGesamtNutzer"></canvas>
  <h2>📊 Statistiken letzte Woche</h2>
  <canvas id="chartVerteilungCheckinsTyp"></canvas>
  <canvas id="chartVerteilungAnreise"></canvas>
  <canvas id="chartVerteilungBild"></canvas>

  <script>
    fetch('https://ice-app.de/backend/lib/get_wochenstatistik.php')
      .then(res => res.json())
      .then(data => {
        const latestWeek = data[data.length - 1];

        const labels = data.map(w => w.start_datum);
        const neueNutzer = data.map(w => w.neue_nutzer);
        const checkins = data.map(w => w.checkins);
        const aktiveNutzer = data.map(w => w.aktive_nutzer);
        const gesamtEisdielen = data.map(w => w.gesamt_eisdielen);
        const gesamtCheckins = data.map(w => w.gesamt_checkins);
        const gesamtNutzer = data.map(w => w.gesamt_nutzer);

        function createBarChart(id, label, dataset, color) {
          new Chart(document.getElementById(id).getContext('2d'), {
            type: 'bar',
            data: {
              labels: labels,
              datasets: [{
                label: label,
                data: dataset,
                backgroundColor: color
              }]
            },
            options: {
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true
                }
              },
              plugins: {
                legend: { display: false },
                title: {
                  display: true,
                  text: label
                }
              }
            }
          });
        }

        function createLineChart(id, label, dataset, color) {
          new Chart(document.getElementById(id).getContext('2d'), {
            type: 'line',
            data: {
              labels: labels,
              datasets: [{
                label: label,
                data: dataset,
                borderColor: color,
                backgroundColor: color + '55',
                tension: 0.3,
                fill: false
              }]
            },
            options: {
              responsive: true,
              scales: {
                y: {
                  beginAtZero: true
                }
              },
              plugins: {
                legend: { display: false },
                title: {
                  display: true,
                  text: label
                }
              }
            }
          });
        }

        function createPieChart(id, label, datasets, backgroundColors) {
          new Chart(document.getElementById(id).getContext('2d'), {
            type: 'pie',
            data: {
              labels: datasets.map(d => d.label),
              datasets: [{
                data: datasets.map(d => d.data),
                backgroundColor: backgroundColors
              }]
            },
            options: {
              responsive: true,
              plugins: {
                legend: { position: 'top' },
                title: {
                  display: true,
                  text: label
                },
                datalabels: {
                  formatter: (value, ctx) => {
                    const total = ctx.chart.data.datasets[0].data.reduce((a, b) => a + b, 0);
                    const percentage = Math.round((value / total) * 100);
                    return `${value} (${percentage}%)`;
                  },
                  color: '#fff',
                  font: {
                    weight: 'bold'
                  }
                }
              }
            },
            plugins: [ChartDataLabels]
          });
        }

        // Parse the distribution data
        const verteilungCheckinsTyp = JSON.parse(latestWeek.verteilung_checkins_typ);
        const verteilungAnreise = JSON.parse(latestWeek.verteilung_anreise);
        const verteilungBild = JSON.parse(latestWeek.verteilung_bild);

        // Charts erzeugen
        createBarChart('chartNeueNutzer', '📍 Neue Nutzer pro Woche', neueNutzer, '#3b82f6');
        createBarChart('chartCheckins', '✅ Check-ins pro Woche', checkins, '#16a34a');
        createBarChart('chartAktiveNutzer', '👤 Aktive Nutzer pro Woche (mind. 1 Check-in)', aktiveNutzer, '#f59e0b');
        createLineChart('chartGesamtEisdielen', '🏪 Entwicklung der Gesamtanzahl der Eisdielen', gesamtEisdielen, '#ec4899');
        createLineChart('chartGesamtCheckins', '📈 Entwicklung der Gesamtanzahl an Check-ins', gesamtCheckins, '#6366f1');
        createLineChart('chartGesamtNutzer', '🕺 Entwicklung der Gesamtanzahl an Nutzern', gesamtNutzer, '#76EEC6');

        // Create pie charts
        createPieChart('chartVerteilungCheckinsTyp', '🍦 Verteilung der Check-ins nach Typ', verteilungCheckinsTyp.map(t => ({ label: t.typ, data: t.anzahl })), ['#FF6384', '#36A2EB', '#FFCE56']);
        createPieChart('chartVerteilungAnreise', '🚗 Verteilung der Anreise', verteilungAnreise.map(a => ({ label: a.anreise || 'Unbekannt', data: a.anzahl })), ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40']);
        createPieChart('chartVerteilungBild', '📸 Verteilung der Check-ins mit/ohne Bild', verteilungBild.map(b => ({ label: b.bild_status, data: b.anzahl })), ['#FF6384', '#36A2EB']);
      });
  </script>
</body>
</html>
	