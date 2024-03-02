# Object Detection Benchmark

This script can be used to an Object Detector like Tensorflow-Lite (Coral), CoreML (Mac and Apple Silicon), and OpenVINO (Intel).


::: warning
The script below runs the benchmark on OpenVINO. Modify the script to run it on a different Object Detection backend(s).
:::

## Reference Times

Below are benchark times that can be expected from various servers. 

|Server|yolov8n 320 Time|EfficientDet-Lite0 Time|
|-|-|-|
|Apple Silicon M1 Ultra|12 seconds|N/A|
|Intel 13500H|16 seconds|N/A|
|2 x Mini PCIe Coral|19 seconds|25 seconds|
|Intel N100|35 seconds|N/A|
|1 x Mini PCIe Coral|38 seconds|50 seconds|
|1 x USB Coral|38 seconds|89 seconds|

::: tip
Tensorflow-Lite uses the EfficientDet-Lite0 model by default, since yolov8n suffers from accuracy loss on int8 quantization. The yolov8n benchmark is listed for reference purposes.
:::

## Script

This script will run 1000 iterations of 2 detections at a time (to test/validate concurrency). The test includes the time it takes to upload the input image to the object detection processor.

```ts
const mo = await mediaManager.createMediaObjectFromUrl('https://user-images.githubusercontent.com/73924/230690188-7a25983a-0630-44e9-9e2d-b4ac150f1524.jpg');
const image = await mediaManager.convertMediaObject<Image & MediaObject>(mo, 'x-scrypted/x-scrypted-image');

const detectors = [
    // '@scrypted/coreml',
    '@scrypted/openvino',
    // '@scrypted/tensorflow-lite',
];

for (const id of detectors) {
    const d: ObjectDetection = systemManager.getDeviceById<ObjectDetection>(id);
    console.log('starting');
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
    for (let i = 0; i < 1000; i++) {
        await Promise.all([d.detectObjects(media),d.detectObjects(media)]);
    }
    const end = Date.now();
    console.log(id, 'done', end - start, 'ms');
}
```
