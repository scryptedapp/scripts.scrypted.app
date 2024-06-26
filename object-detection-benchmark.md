# Object Detection Benchmark

This script can be used to an Object Detector like Tensorflow-Lite (Coral), CoreML (Mac and Apple Silicon), and OpenVINO (Intel).


::: warning
The script below runs the benchmark on OpenVINO. Modify the script to run it on a different Object Detection backend(s).
:::

## Reference Times

Below are benchark times that can be expected from various servers. 

|Server|yolov8n 320|EfficientDet-Lite0|yolov9c 320|yolov6n 320|
|-|-|-|-|-|
|Apple Silicon M1 Ultra|5 seconds|N/A|7 seconds|5 seconds|
|NVIDIA 4090|7 seconds|N/A|13 seconds|7 seconds|
|Intel 13500H|10 seconds|N/A|43 seconds|11 seconds|
|2 x Mini PCIe Coral|19 seconds?|25 seconds|N/A|N/A|
|Intel N100|25 seconds|N/A|152 seconds|27 seconds|
|1 x Mini PCIe Coral|21 seconds|50 seconds|21 seconds|20 seconds|
|1 x USB Coral|20 seconds|89 seconds|Model Too Large|20 seconds|

::: tip
Tensorflow-Lite uses the EfficientDet-Lite0 model by default, since yolov8n suffers from accuracy loss on int8 quantization. The yolov8n benchmark is listed for reference purposes.
:::

## Script

This script will run 250 iterations of 8 detections at a time (to test concurrency and batching). The test includes the time it takes to upload the input image to the object detection processor.

```ts
const mo = await mediaManager.createMediaObjectFromUrl('https://user-images.githubusercontent.com/73924/230690188-7a25983a-0630-44e9-9e2d-b4ac150f1524.jpg');
const image = await mediaManager.convertMediaObject<Image & MediaObject>(mo, 'x-scrypted/x-scrypted-image');

const detectors = [
    // '@scrypted/coreml',
    // '@scrypted/onnx',
    '@scrypted/openvino',
    // '@scrypted/tensorflow-lite',
    // '@scrypted/rknn',
];

const simulatedCameras = 4;
const batch = 4;
const batchesPerCamera = 125;

for (const id of detectors) {
    const d: ObjectDetection = systemManager.getDeviceById<ObjectDetection>(id);
    console.log('starting', id);
    // await d.detectObjects(image);

    const model = await d.getDetectionModel();
    const bytes = await image.toBuffer({
        resize: {
            width: model.inputSize[0],
            height: model.inputSize[1],
        },
        format: model.inputFormat,
    });

    // cache a preconverted image to remove that from benchmark.
    const media: Image & MediaObject = await sdk.mediaManager.createMediaObject(bytes, 'x-scrypted/x-scrypted-image', {
        sourceId: image.sourceId,
        width: model.inputSize[0],
        height: model.inputSize[1],
        format: null,
        toBuffer: async (options: ImageOptions) => bytes,
        toImage: undefined,
        close: () => image.close(),
    })

    const start = Date.now();

    let detections = 0;
    const simulateCameraDetections = async () => {
        for (let i = 0; i < batchesPerCamera; i++) {
            await Promise.all([
                d.detectObjects(media, { batch }),
                d.detectObjects(media),
                d.detectObjects(media),
                d.detectObjects(media),
            ]);
            detections += batch;
        }
    };

    const simulated: Promise<void>[] = [];
    for (let i = 0; i < simulatedCameras; i++) {
        simulated.push(simulateCameraDetections());
    }
    
    await Promise.all(simulated);

    const end = Date.now();
    const ms = end - start;
    console.log(id, 'done', ms, 'ms', detections, 'detections', detections / (ms / 1000), 'detections per second');
}
```
