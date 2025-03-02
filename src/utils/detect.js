import * as tf from "@tensorflow/tfjs";
import { renderBoxes } from "./renderBox";
import labels from "./labels.json";

const numClass = labels.length;
const confidenceThreshold = 0.30;
const confidenceThresholdSpoof = 0.15;
const maxDetections = 5;

// Array to store detection logs
let detectionLogs = [];

/**
 * Start a new session log (clear previous logs)
 */
export const startLogging = () => {
  detectionLogs = []; // Reset logs at session start
};

/**
 * Retrieve stored detection logs
 */
export const getDetectionLogs = () => detectionLogs;

/**
 * Preprocess image / frame before forwarding into the model
 */
const preprocess = (source, modelWidth, modelHeight) => {
  let xRatio, yRatio;

  const input = tf.tidy(() => {
    const img = tf.browser.fromPixels(source);
    const [h, w] = img.shape.slice(0, 2);
    const maxSize = Math.max(w, h);
    const imgPadded = img.pad([[0, maxSize - h], [0, maxSize - w], [0, 0]]);

    xRatio = maxSize / w;
    yRatio = maxSize / h;

    return tf.image.resizeBilinear(imgPadded, [640, 640]).div(255.0).expandDims(0);
  });

  return [input, xRatio, yRatio];
};

/**
 * Function run inference and do detection from source.
 */
export const detect = async (source, model, canvasRef, callback = () => {}) => {
  const [modelWidth, modelHeight] = model.inputShape.slice(1, 3);

  tf.engine().startScope();
  const [input, xRatio, yRatio] = preprocess(source, modelWidth, modelHeight);

  const res = model.net.execute(input);
  const transRes = res.transpose([0, 2, 1]);
  const boxes = tf.tidy(() => {
    const w = transRes.slice([0, 0, 2], [-1, -1, 1]);
    const h = transRes.slice([0, 0, 3], [-1, -1, 1]);
    const x1 = tf.sub(transRes.slice([0, 0, 0], [-1, -1, 1]), tf.div(w, 2));
    const y1 = tf.sub(transRes.slice([0, 0, 1], [-1, -1, 1]), tf.div(h, 2));
    return tf.concat([y1, x1, tf.add(y1, h), tf.add(x1, w)], 2).squeeze();
  });

  const [scores, classes] = tf.tidy(() => {
    const rawScores = transRes.slice([0, 0, 4], [-1, -1, numClass]).squeeze(0);
    return [rawScores.max(1), rawScores.argMax(1)];
  });

  const nms = await tf.image.nonMaxSuppressionAsync(boxes, scores, maxDetections, 0.4, 0.3);
  const boxes_data = boxes.gather(nms, 0).dataSync();
  const scores_data = scores.gather(nms, 0).dataSync();
  const classes_data = classes.gather(nms, 0).dataSync();

  let finalBoxes = [];
  let finalScores = [];
  let finalClasses = [];

  for (let i = 0; i < scores_data.length; i++) {
    if ((classes_data[i] === 0 && scores_data[i] > confidenceThreshold) ||
        (classes_data[i] === 1 && scores_data[i] > confidenceThresholdSpoof)) {
      finalBoxes.push(...boxes_data.slice(i * 4, (i + 1) * 4));
      finalScores.push(scores_data[i]);
      finalClasses.push(classes_data[i]);

      // Store detection logs (time + class ID)
      const detectedClass = labels[classes_data[i]];
      const timestamp = new Date().toLocaleString(); // Get full date & time
      detectionLogs.push({ time: timestamp, class: detectedClass });

      // Display the detection logs to the user (console for now)
      console.log(`Detection: ${timestamp} - ${detectedClass}`);
    }
  }

  if (finalBoxes.length > 0) {
    renderBoxes(canvasRef, finalBoxes, finalScores, finalClasses, [xRatio, yRatio]);
  }

  tf.dispose([res, transRes, boxes, scores, classes, nms]);
  callback();
  tf.engine().endScope();
};

/**
 * Function to detect video from every source.
 */
export const detectVideo = (vidSource, model, canvasRef) => {
  const detectFrame = async () => {
    if (vidSource.videoWidth === 0 && vidSource.srcObject === null) {
      const ctx = canvasRef.getContext("2d");
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      return;
    }

    detect(vidSource, model, canvasRef, () => {
      requestAnimationFrame(detectFrame);
    });
  };

  detectFrame();
};

export default {
  detect,
  detectVideo,
  startLogging,
  getDetectionLogs,
};
