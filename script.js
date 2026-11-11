document.addEventListener("DOMContentLoaded", () => {
    // === 1. SIMULADOR TÉRMICO (PROGRAMAÇÃO & FÍSICA) ===
    const tAguaInput = document.getElementById('t-agua');
    const tArInput = document.getElementById('t-ar');
    const areaInput = document.getElementById('area');
    const ventoInput = document.getElementById('vento');
    const capaToggle = document.getElementById('capa-toggle');

    const vTagua = document.getElementById('v-tagua');
    const vTar = document.getElementById('v-tar');
    const vArea = document.getElementById('v-area');
    const vVento = document.getElementById('v-vento');

    const resPerdaTotal = document.getElementById('res-perda-total');
    const resEconomia = document.getElementById('res-economia');

    // Inicialização do Gráfico Chart.js
    const ctx = document.getElementById('chartPerdas').getContext('2d');
    const chartPerdas = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Evaporação', 'Radiação Infravermelha', 'Convecção', 'Condução'],
            datasets: [{
                data: [0, 0, 0, 0],
                backgroundColor: ['#3b82f6', '#06b6d4', '#10b981', '#f59e0b'],
                borderWidth: 2,
                borderColor: '#1e293b'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    position: 'bottom',
                    labels: { color: '#94a3b8', font: { size: 11 } }
                }
            }
        }
    });

    function calcularPerdas() {
        const tAgua = parseFloat(tAguaInput.value);
        const tAr = parseFloat(tArInput.value);
        const A = parseFloat(areaInput.value);
        const v = parseFloat(ventoInput.value);
        const temCapa = capaToggle.checked;

        // Atualiza Labels
        vTagua.textContent = `${tAgua} °C`;
        vTar.textContent = `${tAr} °C`;
        vArea.textContent = `${A} m²`;
        vVento.textContent = `${v.toFixed(1)} m/s`;

        const deltaT = Math.max(0, tAgua - tAr);
        const T_agua_K = tAgua + 273.15;
        const T_ar_K = tAr + 273.15;

        // 1. Radiação (Stefan-Boltzmann aproximado) em kW
        const sigma = 5.67e-8;
        const emissividade = 0.95;
        let perdaRadiacao = (emissividade * sigma * A * (Math.pow(T_agua_K, 4) - Math.pow(T_ar_K, 4))) / 1000;
        perdaRadiacao = Math.max(0, perdaRadiacao);

        // 2. Convecção em kW
        const h_c = 3.1 + 4.1 * v; // Coeficiente de convecção
        let perdaConveccao = (h_c * A * deltaT) / 1000;

        // 3. Evaporação aproximada em kW
        const pw = 1e-2 * Math.exp(18.976 - 3891 / (tAgua + 225)); // Pressão de vapor
        let perdaEvaporacao = (A * (0.088 + 0.078 * v) * (pw - 0.015) * 2430) / 3600;
        perdaEvaporacao = Math.max(0, perdaEvaporacao);

        // 4. Condução (solo/paredes) em kW
        let perdaConducao = (0.5 * A * deltaT) / 1000;

        // Aplicação da Capa Térmica (Reduz evaporação em 90%, radiação/convecção em 70%)
        if (temCapa) {
            perdaEvaporacao *= 0.1;
            perdaRadiacao *= 0.3;
            perdaConveccao *= 0.3;
            perdaConducao *= 0.8;
        }

        const totalSemCapa = (perdaEvaporacao + perdaRadiacao + perdaConveccao + perdaConducao) * (temCapa ? 3.5 : 1);
        const totalAtual = perdaEvaporacao + perdaRadiacao + perdaConveccao + perdaConducao;

        // Atualização da interface
        resPerdaTotal.textContent = `${totalAtual.toFixed(2)} kW`;
        const economia = temCapa ? 72 : 0;
        resEconomia.textContent = `${economia}%`;

        // Atualizar Gráfico
        chartPerdas.data.datasets[0].data = [
            perdaEvaporacao.toFixed(2),
            perdaRadiacao.toFixed(2),
            perdaConveccao.toFixed(2),
            perdaConducao.toFixed(2)
        ];
        chartPerdas.update();

        // Disparar log simulado de IoT se houver alteração significativa
        atualizarLogIoT(tAgua, tAr, totalAtual, temCapa);
    }

    [tAguaInput, tArInput, areaInput, ventoInput, capaToggle].forEach(el => {
        el.addEventListener('input', calcularPerdas);
    });

    document.getElementById('reset-params').addEventListener('click', () => {
        tAguaInput.value = 28;
        tArInput.value = 18;
        areaInput.value = 32;
        ventoInput.value = 2;
        capaToggle.checked = false;
        calcularPerdas();
    });

    // === 2. SIMULADOR DE TELEMETRIA IOT (ROBÓTICA) ===
    const iotLog = document.getElementById('iot-log');
    let ultimoStatusCapa = false;

    function atualizarLogIoT(tAgua, tAr, perdaTotal, temCapa) {
        if (temCapa !== ultimoStatusCapa) {
            const time = new Date().toLocaleTimeString();
            const msg = temCapa 
                ? `[${time}] [ATUADOR] Servomotor ativado: Capa Térmica FECHADA.`
                : `[${time}] [ATUADOR] Servomotor ativado: Capa Térmica ABERTA.`;
            
            const p = document.createElement('p');
            p.className = temCapa ? "text-emerald-400 font-bold" : "text-amber-400 font-bold";
            p.textContent = msg;
            iotLog.appendChild(p);
            iotLog.scrollTop = iotLog.scrollHeight;
            ultimoStatusCapa = temCapa;
        }
    }

    // === 3. QUIZ INTERATIVO ===
    const perguntas = [
        {
            pergunta: "Por que a piscina perde energia por radiação infravermelha mesmo sem vento?",
            opcoes: [
                "A radiação depende unicamente da evaporação rápida da água.",
                "O infravermelho é uma onda eletromagnética e não necessita de meio material para se propagar.",
                "Porque o solo empurra a radiação diretamente para o céu.",
                "Na ausência de vento, a radiação é convertida em condução pura."
            ],
            correta: 1,
            explicacao: "Correto! A radiação eletromagnética transmite energia no vácuo ou ar sem precisar de contato mecânico."
        },
        {
            pergunta: "Qual processo é estatisticamente o maior responsável pelas perdas térmicas em piscinas descobertas (~70%)?",
            opcoes: ["Condução pelo solo", "Convecção natural", "Evaporação", "Radiação solar inversa"],
            correta: 2,
            explicacao: "Exato! A mudança de estado líquido para gasoso consome grande quantidade de calor latente."
        },
        {
            pergunta: "De acordo com a Lei de Stefan-Boltzmann, como a temperatura afeta a emissão de radiação?",
            opcoes: [
                "A emissão é inversamente proporcional à temperatura.",
                "A emissão varia com a quarta potência da temperatura em Kelvin (T⁴).",
                "A temperatura só afeta a emissão se houver vento acima de 5 m/s.",
                "A emissão cresce de forma perfeitamente linear com a temperatura em Celsius."
            ],
            correta: 1,
            explicacao: "Excelente! Por ser proporcional a T⁴, pequenos aumentos na temperatura resultam em grandes aumentos na emissão de calor."
        }
    ];

    let indiceQuiz = 0;
    let pontuacao = 0;

    const quizStep = document.getElementById('quiz-step');
    const quizScore = document.getElementById('quiz-score');
    const quizQuestion = document.getElementById('quiz-question');
    const quizOptions = document.getElementById('quiz-options');
    const quizFeedback = document.getElementById('quiz-feedback');
    const btnNextQuiz = document.getElementById('btn-next-quiz');

    function carregarPergunta() {
        const q = perguntas[indiceQuiz];
        quizStep.textContent = `Pergunta ${indiceQuiz + 1} de ${perguntas.length}`;
        quizQuestion.textContent = q.pergunta;
        quizOptions.innerHTML = '';
        quizFeedback.classList.add('hidden');
        btnNextQuiz.classList.add('hidden');

        q.opcoes.forEach((opcao, i) => {
            const btn = document.createElement('button');
            btn.className = "w-full text-left p-3 rounded-lg bg-slate-900 border border-slate-700 hover:border-cyan-500 text-xs text-slate-200 transition flex items-center justify-between";
            btn.innerHTML = `<span>${opcao}</span> <i class="fa-regular fa-circle text-slate-500"></i>`;
            btn.onclick = () => verificarResposta(i);
            quizOptions.appendChild(btn);
        });
    }

    function verificarResposta(selecionada) {
        const q = perguntas[indiceQuiz];
        const botoes = quizOptions.querySelectorAll('button');
        
        botoes.forEach(b => b.disabled = true);

        if (selecionada === q.correta) {
            pontuacao += 10;
            quizScore.textContent = `Pontuação: ${pontuacao}`;
            quizFeedback.className = "p-3 rounded-lg text-xs text-center font-medium bg-emerald-950 text-emerald-300 border border-emerald-800";
            quizFeedback.textContent = `✓ ${q.explicacao}`;
        } else {
            quizFeedback.className = "p-3 rounded-lg text-xs text-center font-medium bg-rose-950 text-rose-300 border border-rose-800";
            quizFeedback.textContent = `✗ Incorreto. ${q.explicacao}`;
        }

        quizFeedback.classList.remove('hidden');
        btnNextQuiz.classList.remove('hidden');
    }

    btnNextQuiz.addEventListener('click', () => {
        indiceQuiz++;
        if (indiceQuiz < perguntas.length) {
            carregarPergunta();
        } else {
            quizQuestion.textContent = "Parabéns! Você concluiu o quiz.";
            quizOptions.innerHTML = `<p class="text-center text-sm text-cyan-400 font-bold">Sua pontuação final foi: ${pontuacao} pontos.</p>`;
            quizFeedback.classList.add('hidden');
            btnNextQuiz.classList.add('hidden');
        }
    });

    // Inicializar simulador e quiz no carregamento
    calcularPerdas();
    carregarPergunta();
});
