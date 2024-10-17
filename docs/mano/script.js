let handPoseModel;
let video = document.getElementById('video');
let canvas = document.getElementById('output');
let ctx = canvas.getContext('2d');
let campesino = [];
let pulgarX, pulgarY, indiceX, indiceY;
let refDist = 0;
let d = 0, m = 0;
let atrapado = false;
let oprimido = false;
let indexImage = 0;
let hands = [];

// Preload imágenes
for (let i = 0; i < 10; i++) {
  let img = new Image();
  img.src = "imagenes/frame" + (i + 1) + ".png";
  campesino.push(img);
}

// Configurar video
navigator.mediaDevices.getUserMedia({ video: true })
  .then(stream => {
    video.srcObject = stream;
    video.play();
    runHandPose();
  })
  .catch(err => {
    console.error("Error accessing the camera: " + err);
  });

// Cargar modelo HandPose
async function runHandPose() {
  handPoseModel = await handpose.load();
  detectHands();
}

// Detectar manos en video
async function detectHands() {
  const predictions = await handPoseModel.estimateHands(video);
  if (predictions.length > 0) {
    hands = predictions;
    procesarMano(hands[0]);
  }
  requestAnimationFrame(detectHands);
}

// Procesar las posiciones de la mano detectada
function procesarMano(hand) {
  // Obtener coordenadas del pulgar (dedo 4) y del índice (dedo 8)
  let keypointPulgar = hand.landmarks[4];
  let keypointIndice = hand.landmarks[8];
  
  pulgarX = keypointPulgar[0];
  pulgarY = keypointPulgar[1];
  indiceX = keypointIndice[0];
  indiceY = keypointIndice[1];

  // Dibujar los puntos del pulgar e índice
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
  ctx.fillStyle = 'yellow';
  ctx.beginPath();
  ctx.arc(pulgarX, pulgarY, 5, 0, 2 * Math.PI);
  ctx.arc(indiceX, indiceY, 5, 0, 2 * Math.PI);
  ctx.fill();

  // Calcular la distancia entre el pulgar y el índice
  d = Math.hypot(pulgarX - indiceX, pulgarY - indiceY);

  // Usar otros puntos de la mano como referencia (muñeca a nudillo)
  let keypointMuñeca = hand.landmarks[0];
  let keypointMedio = hand.landmarks[9];
  refDist = Math.hypot(keypointMuñeca[0] - keypointMedio[0], keypointMuñeca[1] - keypointMedio[1]);

  // Mapeo de la distancia a un valor relativo
  m = Math.min(Math.max(d / refDist, 0), 1).toFixed(2); // 0: cerrado, 1: abierto

  controlarEstados();
  mostrarInformacion();
  mostrarCampesino();
}

// Controlar los estados de 'atrapado' y 'oprimido'
function controlarEstados() {
  atrapado = (m >= 0.9 && m <= 1.02);
  oprimido = (m < 0.5 && atrapado);

  // Cambiar imagen si está atrapado
  if (atrapado) {
    // Cambia la imagen según el índice
    if (indexImage < campesino.length - 1) {
      indexImage++;
    } else {
      indexImage = 0; // Reiniciar el índice si alcanzó el final
    }
  } else {
    indexImage = 0; // Reiniciar índice si no está atrapado
  }
}

// Mostrar imagen del campesino si está atrapado pero no oprimido
function mostrarCampesino() {
  if (atrapado && !oprimido) {
    let h = pulgarY - indiceY;
    let ph = campesino[indexImage].height / h;
    let wref = campesino[indexImage].width / ph;
    ctx.drawImage(campesino[indexImage], indiceX - (wref / 2), indiceY, wref, h);
  }
}

// Mostrar la información en pantalla
function mostrarInformacion() {
  ctx.fillStyle = 'white';
  ctx.font = '16px Arial';
  ctx.fillText(`m: ${m}`, 20, 20);
}
