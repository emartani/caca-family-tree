const words = ["GRANDMA", "GRANDPA", "MOTHER", "FATHER", "UNCLE", "SISTER", "BROTHER", "COUSIN"];
let palavrasNivel = [];
let grid = [];
let palavrasEncontradas = [];
let palavrasReveladas = []; // Array para manter o controle das palavras reveladas clicando na imagem

let toqueIniciado = false;
let mousePressionado = false;
let primeiraCelulaSelecionada = null;
let palavraTemporaria = "";
let celulasSelecionadas = [];

// Variável para o áudio de celebração
let celebrationAudio;

// Mapeamento de palavras para caminhos de imagem
const wordImages = {
  "GRANDMA": "images/INTERROGACAO.PNG",
  "GRANDPA": "images/INTERROGACAO.PNG",
  "MOTHER": "images/INTERROGACAO.PNG",
  "FATHER": "images/INTERROGACAO.PNG",
  "UNCLE": "images/INTERROGACAO.PNG",
  "SISTER": "images/INTERROGACAO.PNG",
  "BROTHER": "images/INTERROGACAO.PNG",
  "COUSIN": "images/INTERROGACAO.PNG"
};

// Cores para as partículas dos fogos de artifício
const coresFogos = ['#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FFA500', '#FFC0CB'];

/**
 * Gera um novo caça-palavras com base no nível de dificuldade selecionado.
 * Limpa o tabuleiro anterior e redefine o estado do jogo.
 */
function detectarDispositivoPequeno() {
  return window.innerWidth < 768; // Ajuste o limite conforme necessário
}

function gerarCacaPalavras() {
  const container = document.getElementById("cacaPalavrasContainer");
  const listaPalavrasElement = document.getElementById("listaPalavras");
  const nivelSelect = document.getElementById("nivel");

  // Limpa conteúdo
  container.innerHTML = "";
  listaPalavrasElement.innerHTML = "";
  palavrasEncontradas = [];
  palavrasReveladas = [];

  // Reset fogos e áudio
  const fireworksContainer = document.getElementById("fireworksContainer");
  if (fireworksContainer) fireworksContainer.innerHTML = '';
  if (celebrationAudio) {
    celebrationAudio.pause();
    celebrationAudio.currentTime = 0;
  }

  let linhas, colunas, palavrasSelecionadas, orientacao;

  if (detectarDispositivoPequeno()) {
    // 📱 Caso celular/tablet
    nivelSelect.style.display = "none"; // Esconde seletor
    palavrasSelecionadas = [...words].slice(0, 6); // Menos palavras
    linhas = 10;
    colunas = 10;
    orientacao = "horizontal"; // Mantém simples
  } else {
    // 💻 Caso desktop
    nivelSelect.style.display = "inline"; // Mostra seletor
    const nivel = nivelSelect.value;
    if (nivel === "facil") {
      const shuffledWords = [...words];
      for (let i = shuffledWords.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledWords[i], shuffledWords[j]] = [shuffledWords[j], shuffledWords[i]];
      }
      palavrasSelecionadas = shuffledWords.slice(0, 6);
      linhas = 10;
      colunas = 12;
      orientacao = "horizontal";
    } else {
      palavrasSelecionadas = words;
      let maiorPalavraTamanho = Math.max(...palavrasSelecionadas.map(p => p.length));
      linhas = Math.max(maiorPalavraTamanho + 2, 12);
      colunas = Math.max(maiorPalavraTamanho + 2, 12);
      orientacao = "horizontal-vertical";
    }
  }

  palavrasNivel = palavrasSelecionadas;
  gerarGrid(linhas, colunas, palavrasNivel, "horizontal-vertical");
  exibirGrid(container, colunas);
  exibirListaPalavras(listaPalavrasElement);
}

/**
 * Cria a estrutura do grid (matriz) e preenche com palavras e letras aleatórias.
 * @param {number} linhas - Número de linhas do grid.
 * @param {number} colunas - Número de colunas do grid.
 * @param {string[]} palavras - Array de palavras a serem inseridas no grid.
 * @param {string} orientacao - 'horizontal', 'vertical', 'ambos' ou 'horizontal-vertical' para a direção das palavras.
 */
function gerarGrid(linhas, colunas, palavras, orientacao) {
  // Inicializa o grid com células vazias
  grid = Array(linhas).fill(null).map(() => Array(colunas).fill(""));
  preencherPalavras(palavras, orientacao); // Insere as palavras no grid
  preencherVazios(); // Preenche as células vazias com letras aleatórias
}

/**
 * Tenta posicionar cada palavra no grid de forma aleatória.
 * @param {string[]} palavras - Array de palavras.
 * @param {string} orientacao - 'horizontal', 'vertical', 'ambos' ou 'horizontal-vertical' para a direção.
 */
function preencherPalavras(palavras, orientacao) {
  palavras.forEach(palavra => {
    let colocado = false;
    let tentativas = 0;
    const maxTentativas = 1000; // Limite para evitar loops infinitos

    while (!colocado && tentativas < maxTentativas) {
      const linhaInicio = Math.floor(Math.random() * grid.length);
      const colunaInicio = Math.floor(Math.random() * grid[0].length);
      let direcao;

      if (orientacao === "horizontal") {
        direcao = { x: 1, y: 0 }; // Apenas horizontal para a direita
      } else if (orientacao === "horizontal-vertical") {
        // Direções permitidas para o nível difícil: Horizontal (direita) e Vertical (baixo)
        const direcoesPermitidas = [
          { x: 1, y: 0 },   // Horizontal para a direita
          { x: 0, y: 1 }    // Vertical para baixo
        ];
        direcao = direcoesPermitidas[Math.floor(Math.random() * direcoesPermitidas.length)];
      } else { // Orientação "ambos" (todas as 8 direções, incluindo reversas e diagonais)
        const direcoesPossiveis = [
          { x: 1, y: 0 },   // Horizontal para a direita
          { x: -1, y: 0 },  // Horizontal para a esquerda
          { x: 0, y: 1 },   // Vertical para baixo
          { x: 0, y: -1 },  // Vertical para cima
          { x: 1, y: 1 },   // Diagonal para baixo e direita
          { x: 1, y: -1 },  // Diagonal para cima e direita
          { x: -1, y: 1 },  // Diagonal para baixo e esquerda
          { x: -1, y: -1 }  // Diagonal para cima e esquerda
        ];
        direcao = direcoesPossiveis[Math.floor(Math.random() * direcoesPossiveis.length)];
      }

      const linhaFim = linhaInicio + direcao.y * (palavra.length - 1);
      const colunaFim = colunaInicio + direcao.x * (palavra.length - 1);

      // Verifica se a palavra cabe e não colide com outras letras
      if (
        linhaFim >= 0 && linhaFim < grid.length &&
        colunaFim >= 0 && colunaFim < grid[0].length &&
        verificarEspaco(palavra, linhaInicio, colunaInicio, direcao)
      ) {
        colocarPalavra(palavra, linhaInicio, colunaInicio, direcao);
        colocado = true;
      }
      tentativas++;
    }
  });
}

/**
 * Verifica se uma palavra pode ser colocada em uma determinada posição e direção.
 * @param {string} palavra - A palavra a ser verificada.
 * @param {number} linha - Linha de início.
 * @param {number} coluna - Coluna de início.
 * @param {object} direcao - Objeto {x, y} representando a direção.
 * @returns {boolean} - True se houver espaço, false caso contrário.
 */
function verificarEspaco(palavra, linha, coluna, direcao) {
  for (let i = 0; i < palavra.length; i++) {
    const novaLinha = linha + direcao.y * i;
    const novaColuna = coluna + direcao.x * i;

    // Verifica se a posição está dentro dos limites do grid
    if (novaLinha < 0 || novaLinha >= grid.length || novaColuna < 0 || novaColuna >= grid[0].length) {
      return false;
    }
    // Verifica se a célula já está ocupada por uma letra diferente (ou parte da mesma palavra)
    if (grid[novaLinha][novaColuna] !== "" && grid[novaLinha][novaColuna] !== palavra[i]) {
      return false;
    }
  }
  return true;
}

/**
 * Coloca uma palavra no grid em uma determinada posição e direção.
 * @param {string} palavra - A palavra a ser colocada.
 * @param {number} linha - Linha de início.
 * @param {number} coluna - Coluna de início.
 * @param {object} direcao - Objeto {x, y} representando a direção.
 */
function colocarPalavra(palavra, linha, coluna, direcao) {
  for (let i = 0; i < palavra.length; i++) {
    const novaLinha = linha + direcao.y * i;
    const novaColuna = coluna + direcao.x * i;
    grid[novaLinha][novaColuna] = palavra[i];
  }
}

/**
 * Preenche as células vazias do grid com letras aleatórias.
 */
function preencherVazios() {
  const letras = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  for (let i = 0; i < grid.length; i++) {
    for (let j = 0; j < grid[i].length; j++) {
      if (grid[i][j] === "") {
        grid[i][j] = letras[Math.floor(Math.random() * letras.length)];
      }
    }
  }
}

/**
 * Exibe o grid na interface do usuário, criando os elementos de célula.
 * Adiciona listeners para seleção de células.
 * @param {HTMLElement} container - O elemento HTML onde o grid será exibido.
 * @param {number} colunas - Número de colunas do grid.
 */
function exibirGrid(container, colunas) {
  const gridContainer = document.createElement("div");
  gridContainer.classList.add("grid-container");
  gridContainer.style.gridTemplateColumns = `repeat(${colunas}, 1fr)`;

  grid.forEach((linha, rowIndex) => {
    linha.forEach((letra, colIndex) => {
      const cell = document.createElement("div");
      cell.classList.add("cell");
      cell.textContent = letra;
      cell.dataset.row = rowIndex;
      cell.dataset.col = colIndex;

      // Event listeners para interação com mouse
      cell.addEventListener("mousedown", iniciarSelecao);
      cell.addEventListener("mouseover", selecionarComMouseOver);
      cell.addEventListener("mouseup", finalizarSelecao);

      // Event listeners para interação com toque em dispositivos móveis
      cell.addEventListener("touchstart", iniciarSelecao);
      cell.addEventListener("touchmove", selecionarComToque);
      cell.addEventListener("touchend", finalizarSelecao);
      cell.addEventListener("touchcancel", finalizarSelecao);

      gridContainer.appendChild(cell);
    });
  });
  // Adiciona listeners ao container para finalizar a seleção se o mouse/toque sair da célula
  container.addEventListener("mouseup", finalizarSelecao);
  container.addEventListener("touchend", finalizarSelecao);
  container.addEventListener("touchcancel", finalizarSelecao);
  container.appendChild(gridContainer);
}

/**
 * Inicia o processo de seleção de células quando o mouse é pressionado ou o toque é iniciado.
 * @param {Event} event - O evento (MouseEvent ou TouchEvent).
 */
function iniciarSelecao(event) {
    // Se a mensagem de parabéns estiver visível, não permite interação
    if (document.getElementById("parabensMensagem") && document.getElementById("parabensMensagem").style.display === "block") {
        return;
    }

    const target = event.touches ? event.touches[0].target : event.target;
    if (!target.classList.contains("cell")) return;

    toqueIniciado = !!event.touches;
    mousePressionado = !event.touches;

    resetSelecaoVisual();
    primeiraCelulaSelecionada = target;
    palavraTemporaria = target.textContent;
    celulasSelecionadas = [target];
    target.classList.add("selecionada");

    if (event.touches) {
        event.preventDefault();
    }
}

/**
 * Continua a seleção de células enquanto o mouse está pressionado e se move sobre elas.
 * @param {MouseEvent} event - O evento MouseEvent.
 */
function selecionarComMouseOver(event) {
    if (mousePressionado && primeiraCelulaSelecionada) {
        const cell = event.target;
        if (cell.classList.contains("cell") && !celulasSelecionadas.includes(cell)) {
            const linhaAtual = parseInt(cell.dataset.row);
            const colunaAtual = parseInt(cell.dataset.col);
            const ultimaCelula = celulasSelecionadas[celulasSelecionadas.length - 1];
            const linhaUltima = parseInt(ultimaCelula.dataset.row);
            const colunaUltima = parseInt(ultimaCelula.dataset.col);

            // Apenas horizontal ou vertical
            const isHorizontal = linhaAtual === linhaUltima && Math.abs(colunaAtual - colunaUltima) === 1;
            const isVertical = colunaAtual === colunaUltima && Math.abs(linhaAtual - linhaUltima) === 1;

            if (isHorizontal || isVertical) { // Alterado para apenas horizontal ou vertical
                cell.classList.add("selecionada");
                palavraTemporaria += cell.textContent;
                celulasSelecionadas.push(cell);
            }
        }
    }
}

/**
 * Continua a seleção de células enquanto o dedo está na tela e se move sobre elas.
 * @param {TouchEvent} event - O evento TouchEvent.
 */
function selecionarComToque(event) {
    if (toqueIniciado && primeiraCelulaSelecionada && event.touches.length > 0) {
        const touch = event.touches[0];
        // Obtém o elemento sob a posição do toque
        const target = document.elementFromPoint(touch.clientX, touch.clientY);

        if (target && target.classList.contains("cell")) {
            if (!celulasSelecionadas.includes(target)) {
                const linhaAtual = parseInt(target.dataset.row);
                const colunaAtual = parseInt(target.dataset.col);
                const ultimaCelula = celulasSelecionadas[celulasSelecionadas.length - 1];
                const linhaUltima = parseInt(ultimaCelula.dataset.row);
                const colunaUltima = parseInt(ultimaCelula.dataset.col);

                // Apenas horizontal ou vertical
                const isHorizontal = linhaAtual === linhaUltima && Math.abs(colunaAtual - colunaUltima) === 1;
                const isVertical = colunaAtual === colunaUltima && Math.abs(linhaAtual - linhaUltima) === 1;

                if (isHorizontal || isVertical) { // Alterado para apenas horizontal ou vertical
                    target.classList.add("selecionada");
                    palavraTemporaria += target.textContent;
                    celulasSelecionadas.push(target);
                }
            }
            event.preventDefault();
        }
    }
}


/**
 * Finaliza o processo de seleção quando o mouse é solto ou o toque é encerrado.
 * Chama a função para verificar a palavra selecionada.
 * @param {Event} event - O evento (MouseEvent ou TouchEvent).
 */
function finalizarSelecao(event) {
  if ((mousePressionado || toqueIniciado) && palavraTemporaria.length > 0) {
    verificarPalavra();
  }
  // Reseta os estados de controle
  mousePressionado = false;
  toqueIniciado = false;
  primeiraCelulaSelecionada = null;
}

/**
 * Inverte uma string.
 * @param {string} str - A string a ser invertida.
 * @returns {string} - A string invertida.
 */
function reverterString(str) {
  return str.split("").reverse().join("");
}

/**
 * Remove a classe 'selecionada' de todas as células e reseta a palavra temporária.
 */
function resetSelecaoVisual() {
  document.querySelectorAll(".cell.selecionada").forEach(cell => cell.classList.remove("selecionada"));
  palavraTemporaria = "";
  celulasSelecionadas = [];
}

/**
 * Exibe a lista de palavras a serem encontradas, com suas imagens e nomes ocultos.
 * @param {HTMLElement} container - O elemento HTML onde a lista será exibida.
 */
function exibirListaPalavras(container) {
  container.innerHTML = "";
  palavrasNivel.forEach(palavra => {
    const listItem = document.createElement("li");
    const img = document.createElement("img");
    img.src = wordImages[palavra];
    img.alt = palavra;
    img.dataset.word = palavra;
    img.addEventListener("click", revelarPalavra);

    const wordText = document.createElement("span");
    wordText.classList.add("word-text");
    wordText.textContent = palavra;

    listItem.appendChild(img);
    listItem.appendChild(wordText);

    if (palavrasEncontradas.includes(palavra)) {
      listItem.classList.add("found");
      listItem.classList.add("revealed");
    } else if (palavrasReveladas.includes(palavra)) {
      listItem.classList.add("revealed");
    }

    container.appendChild(listItem);
  });
}

/**
 * Revela o texto de uma palavra quando sua imagem é clicada.
 * @param {Event} event - O evento de clique.
 */
function revelarPalavra(event) {
  const imgElement = event.target;
  const wordToReveal = imgElement.dataset.word;
  const listItem = imgElement.closest("li");

  if (listItem && !listItem.classList.contains("found")) {
    listItem.classList.add("revealed");
    if (!palavrasReveladas.includes(wordToReveal)) {
        palavrasReveladas.push(wordToReveal);
    }
  }
}

/**
 * Atualiza o estado visual das palavras na lista (marcando como encontradas).
 */
function atualizarListaPalavras() {
  const listaPalavrasElement = document.getElementById("listaPalavras");
  listaPalavrasElement.querySelectorAll("li").forEach(li => {
    const wordTextElement = li.querySelector(".word-text");
    if (wordTextElement && palavrasEncontradas.includes(wordTextElement.textContent)) {
      li.classList.add("found");
      li.classList.add("revealed");
    }
  });
}

/**
 * Verifica se a palavra selecionada pelo usuário corresponde a alguma palavra do jogo.
 * Se sim, a marca como encontrada e verifica a vitória.
 */
function verificarPalavra() {
  const palavraNormalizada = palavraTemporaria.toUpperCase();
  const palavraRevertidaNormalizada = reverterString(palavraTemporaria).toUpperCase();

  let palavraEncontradaAtual = null;

  // No nível difícil, as palavras NÃO estarão de trás para frente no grid,
  // mas o usuário ainda pode selecioná-las "de trás para frente".
  // Então, verificamos apenas a palavra normalizada no `palavrasNivel`.
  if (palavrasNivel.includes(palavraNormalizada)) {
    palavraEncontradaAtual = palavraNormalizada;
  }
  // Remove a verificação da palavra invertida se você não quer que o jogador possa selecionar reversamente
  // NO ENTANTO, se você apenas não quer que o gerador COLOQUE palavras reversas, mas permite a seleção reversa,
  // mantenha a linha abaixo. Pelo que entendi, você não quer que o jogo gere palavras reversas.
  // if (palavrasNivel.includes(palavraRevertidaNormalizada)) {
  //   palavraEncontradaAtual = palavraRevertidaNormalizada;
  // }


  if (palavraEncontradaAtual && !palavrasEncontradas.includes(palavraEncontradaAtual)) {
    palavrasEncontradas.push(palavraEncontradaAtual);
    celulasSelecionadas.forEach(cell => cell.classList.add("found"));
    atualizarListaPalavras();
    resetSelecaoVisual();
    verificarVitoria();
  } else {
    resetSelecaoVisual();
  }
}

// --- Funções de Vitória e Fogos de Artifício ---

/**
 * Verifica se todas as palavras foram encontradas para acionar a condição de vitória.
 */
function verificarVitoria() {
    if (palavrasEncontradas.length === palavrasNivel.length && palavrasNivel.length > 0) {
        exibirParabensEFogos();
    }
}

/**
 * Cria um elemento de partícula de fogo de artifício e adiciona ao DOM.
 * @param {number} x - Posição X (horizontal) da partícula.
 * @param {number} y - Posição Y (vertical) da partícula.
 * @param {string} color - Cor da partícula (ex: '#FF0000').
 */
function criarParticulaFogo(x, y, color) {
    const particle = document.createElement('div');
    particle.classList.add('firework-particle');
    particle.style.left = `${x}px`;
    particle.style.top = `${y}px`;
    particle.style.setProperty('--particle-color', color);
    document.getElementById('fireworksContainer').appendChild(particle);

    particle.addEventListener('animationend', () => {
        particle.remove();
    });
}

/**
 * Gera um conjunto de explosões de fogos de artifício na tela.
 * @param {number} numExplosions - Número total de explosões a serem geradas.
 * @param {number} particlesPerExplosion - Número de partículas por explosão.
 */
function gerarFogosDeArtificio(numExplosions = 5, particlesPerExplosion = 30) {
    const fireworksContainer = document.getElementById('fireworksContainer');
    if (fireworksContainer) {
        fireworksContainer.innerHTML = '';
    }

    for (let i = 0; i < numExplosions; i++) {
        setTimeout(() => {
            const x = Math.random() * window.innerWidth;
            const y = Math.random() * window.innerHeight * 0.7;

            const color = coresFogos[Math.floor(Math.random() * coresFogos.length)];

            for (let j = 0; j < particlesPerExplosion; j++) {
                const offsetX = (Math.random() - 0.5) * 100;
                const offsetY = (Math.random() - 0.5) * 100;
                criarParticulaFogo(x + offsetX, y + offsetY, color);
            }
        }, i * 500);
    }
}

/**
 * Exibe a mensagem de parabéns, inicia os fogos de artifício, toca o áudio
 * e configura o timer para reiniciar o jogo.
 */
function exibirParabensEFogos() {
    const parabensDiv = document.getElementById("parabensMensagem");
    if (parabensDiv) {
        parabensDiv.style.display = "block";

        gerarFogosDeArtificio(8, 40);

        if (!celebrationAudio) {
            celebrationAudio = new Audio('claps.mp3');
            celebrationAudio.loop = false;
        }
        celebrationAudio.currentTime = 0;
        celebrationAudio.play().catch(e => console.error("Erro ao reproduzir áudio:", e));

        document.getElementById("cacaPalavrasContainer").style.pointerEvents = "none";
        document.getElementById("palavrasEncontrar").style.pointerEvents = "none";
        document.getElementById("nivel").disabled = true;
        document.querySelector('body').style.overflow = 'hidden';

        setTimeout(() => {
            parabensDiv.style.display = "none";
            const fireworksContainer = document.getElementById('fireworksContainer');
            if (fireworksContainer) {
                fireworksContainer.innerHTML = '';
            }
            document.querySelector('body').style.overflow = 'auto';

            if (celebrationAudio) {
                celebrationAudio.pause();
                celebrationAudio.currentTime = 0;
            }

            document.getElementById("cacaPalavrasContainer").style.pointerEvents = "auto";
            document.getElementById("palavrasEncontrar").style.pointerEvents = "auto";
            document.getElementById("nivel").disabled = false;

            gerarCacaPalavras();
        }, 10000);
    }
}

// Inicia o jogo ao carregar a página
gerarCacaPalavras();