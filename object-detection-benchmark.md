# Object Detection Benchmark

This script can be used to an Object Detector like Tensorflow-Lite (Coral), CoreML (Mac and Apple Silicon), and OpenVINO (Intel).


::: warning
The script below runs the benchmark on OpenVINO. Modify the script to run it on a different Object Detection backend(s).
:::

## Reference Times

Below are benchark times that can be expected from various servers. 

|Server|yolov9t|yolov9c|
|-|-|-|
|Apple Silicon M1 Ultra|5 seconds|7 seconds|
|NVIDIA 4090|7 seconds|13 seconds|
|Intel 125H|10 seconds|19 seconds|
|Intel 13500H|10 seconds|43 seconds|
|2 x Mini PCIe Coral|19 seconds?|N/A|
|Intel N100|25 seconds|152 seconds|
|1 x Mini PCIe Coral|21 seconds|21 seconds|
|1 x USB Coral|20 seconds|Model Too Large|

## Script

This script will run 250 iterations of 8 detections at a time (to test concurrency and batching). The test includes the time it takes to upload the input image to the object detection processor.

```ts
const os = require('os');
const { execSync } = require('child_process');

const mo = await mediaManager.createMediaObjectFromUrl('https://user-images.githubusercontent.com/73924/230690188-7a25983a-0630-44e9-9e2d-b4ac150f1524.jpg');
const image = await mediaManager.convertMediaObject<Image & MediaObject>(mo, 'x-scrypted/x-scrypted-image');
const detectors = [
    '@scrypted/openvino',
    '@scrypted/ncnn',
    '@scrypted/coreml',
    '@scrypted/onnx',
    '@scrypted/tensorflow-lite',
    '@scrypted/rknn',
];
const simulatedCameras = 4;
const batch = 4;
const batchesPerCamera = 125;

function logProgress(current: number, total: number, startTime: number) {
    const percentage = Math.floor((current / total) * 100);
    const elapsedTime = (Date.now() - startTime) / 1000;
    const estimatedTotalTime = (elapsedTime / current) * total;
    const remainingTime = Math.max(0, estimatedTotalTime - elapsedTime);
    console.log(`Progress: ${percentage}% - Est. remaining time: ${remainingTime.toFixed(1)}s`);
}

function getCPUInfo() {
    try {
        const cpus = os.cpus();
        return cpus[0].model;
    } catch (error) {
        return 'Not found';
    }
}

function getMemoryInfo() {
    try {
        const totalMem = os.totalmem() / (1024 * 1024 * 1024);
        const freeMem = os.freemem() / (1024 * 1024 * 1024);
        return `Total: ${totalMem.toFixed(2)} GB, Free: ${freeMem.toFixed(2)} GB`;
    } catch (error) {
        return 'Not found';
    }
}

console.log('########################');
console.log(new Date().toLocaleString());
console.log('########################');
console.log('CPU Model:', getCPUInfo());
console.log('Memory:', getMemoryInfo());
console.log('OS Release:', os.release() || 'Not found');

let completedDetections = 0;
async function runDetector(d: ObjectDetection) {
    const model = await d.getDetectionModel();
    console.log('Model', model);
    const bytes = Buffer.alloc(model.inputSize[0] * model.inputSize[1] * 3);
    const media = await sdk.mediaManager.createMediaObject(bytes, 'x-scrypted/x-scrypted-image', {
        sourceId: image.sourceId,
        width: model.inputSize[0],
        height: model.inputSize[1],
        ffmpegFormats: true,
        format: null,
        toBuffer: async (options) => bytes,
        toImage: undefined,
        close: () => image.close(),
    })
    const start = Date.now();
    let detections = 0;
    const totalDetections = simulatedCameras * batchesPerCamera * batch;

    console.log("Starting benchmark...");

    let lastLog = start;
    const simulateCameraDetections = async () => {
        for (let i = 0; i < batchesPerCamera; i++) {
            await Promise.all([
                d.detectObjects(media, { batch }),
                d.detectObjects(media),
                d.detectObjects(media),
                d.detectObjects(media),
            ]);
            detections += batch;
            completedDetections += batch;
            const now = Date.now();
            if (now - lastLog > 3000) {
                lastLog = now;
                logProgress(detections, totalDetections, start);
            }
        }
    };

    const simulated = [];
    for (let i = 0; i < simulatedCameras; i++) {
        simulated.push(simulateCameraDetections());
    }

    await Promise.all(simulated);
}

const start = Date.now();
let totalDetectors = 0;
let clusterDps: number;
await Promise.allSettled(detectors.map(async id => {
    const d = systemManager.getDeviceById<Settings & ObjectDetection & ClusterForkInterface>(id);
    if (!d) {
        console.log(`${id} not found, skipping.`);
        return;
    }

    console.log(`\nStarting ${id}`);
    console.log(`${id} Plugin Version:`, d.info?.version || 'Not found');

    async function runClusterWorkerDetector(clusterWorkerName: string, d: ObjectDetection & Settings) {
        console.log('Settings:');
        try {
            const settings = await d.getSettings();
            for (const setting of settings) {
                console.log(`  ${setting.title}: ${setting.value}`);
            }
        }
        catch (error) {
            console.log('  Unable to retrieve settings');
        }

        await runDetector(d);

        const end = Date.now();
        if (!clusterDps)
            clusterDps = completedDetections / ((end - start) / 1000);

        const ms = end - start;
        console.log(`\n${clusterWorkerName ? clusterWorkerName + ' ' : ''}${id} benchmark complete:`);
        console.log(`Total time: ${ms} ms`);
        const detections = batchesPerCamera * simulatedCameras * batch;
        console.log(`Total detections: ${detections}`);
        console.log(`Detection rate: ${(detections / (ms / 1000)).toFixed(2)} detections per second`);
        totalDetectors++;
    }

    if (!sdk.clusterManager?.getClusterMode?.()) {
        await runClusterWorkerDetector(undefined, d);
    }
    else {
        const workers = await sdk.clusterManager.getClusterWorkers();
        await Promise.allSettled(Object.values(workers).map(async worker => {
            if (!worker.labels.includes(id))
                return;
            try {
                const forked = await d.forkInterface<ObjectDetection & Settings>(ScryptedInterface.ObjectDetection, {
                    clusterWorkerId: worker.id,
                });
                console.log('Running on cluster worker', worker.name);
                await runClusterWorkerDetector(worker.name, forked);
            }
            catch (e) {
                console.log(`Error running benchmark for ${id}:`, e);
            }
        }));
    }
}));

if (sdk.clusterManager?.getClusterMode?.()) {
    const end = Date.now();
    console.log(`\nCluster benchmark complete:`);
    console.log(`Detection rate: ${clusterDps.toFixed(2)} detections per second`);
}
```
