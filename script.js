let conn;
let peer;
let receiverName;

const body = document.querySelector('body');
const dcp = document.querySelector('#display-cp');
const cp = document.querySelector('.control-panel');

document.addEventListener("dragover", function(event) {
    event.preventDefault();
});  


body.addEventListener('drop', (e)=>{
    e.preventDefault();
    e.stopPropagation();

    const f = e.dataTransfer.files[0];

    if (!f.type.match('application/json')) {
        alert('Not a JSON file!');
    } else {

        const fr = new FileReader();
        fr.onloadend = function(ev) {        //読み終わるとこれがよばれて、ここで結果を見るんだ
            let result = JSON.parse(this.result);
            console.log(result);
            peer = connectPeerServer(result);

            peer.on('open', function(id) {
                console.log('My peer ID is: ' + id);
            });
            
        };
        fr.readAsText(f);       //ここで読んで、
    }

});

function connectPeerServer(settings) {
    const peerSv = new Peer(settings.sender.peerName, {
        host: settings.sender.host,
        port: settings.sender.port,
        path: settings.sender.path,
    });
    receiverName = settings.receiver.peerName;
    return peerSv;
}

function connectPeer() {
    conn = peer.connect(receiverName);
    conn.on('data', data => {
        console.log(`client2 message:${data}`);
    });

    peer.on('connection', conn => {
        console.log('connected by another client')
        conn.on('data', data => {
            console.log(`message from client2:${data}`);
        });
    });    
    
}

function send_message(positions) {
   conn.send(positions);
}

dcp.addEventListener("change", e => {
    // console.log(e);
    if (e.target.checked === true) {
        cp.style.display = "none";
    } else {
        cp.style.display = "";
    }    
});


import DeviceDetector from "https://cdn.skypack.dev/device-detector-js@2.2.10";
testSupport([
    { client: 'Chrome' },
]);
function testSupport(supportedDevices) {
    const deviceDetector = new DeviceDetector();
    const detectedDevice = deviceDetector.parse(navigator.userAgent);
    let isSupported = false;
    for (const device of supportedDevices) {
        if (device.client !== undefined) {
            const re = new RegExp(`^${device.client}$`);
            if (!re.test(detectedDevice.client.name)) {
                continue;
            }
        }
        if (device.os !== undefined) {
            const re = new RegExp(`^${device.os}$`);
            if (!re.test(detectedDevice.os.name)) {
                continue;
            }
        }
        isSupported = true;
        break;
    }
    if (!isSupported) {
        alert(`This demo, running on ${detectedDevice.client.name}/${detectedDevice.os.name}, ` +
            `is not well supported at this time, expect some flakiness while we improve our code.`);
    }
}
console.log(window);
const controls = window;
const LandmarkGrid = window.LandmarkGrid;
const drawingUtils = window;
const mpPose = window;
const options = {
    locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/pose@${mpPose.VERSION}/${file}`;
    }
};

const videoElement = document.getElementsByClassName('input_video')[0];
const canvasElement = document.getElementsByClassName('output_canvas')[0];
const controlsElement = document.getElementsByClassName('control-panel')[0];
const canvasCtx = canvasElement.getContext('2d');
const fpsControl = new controls.FPS();
const spinner = document.querySelector('.loading');
spinner.ontransitionend = () => {
    spinner.style.display = 'none';
};
const landmarkContainer = document.getElementsByClassName('landmark-grid-container')[0];
const grid = new LandmarkGrid(landmarkContainer, {
    connectionColor: 0xCCCCCC,
    definedColors: [{ name: 'LEFT', value: 0xffa500 }, { name: 'RIGHT', value: 0x00ffff }],
    range: 2,
    fitToGrid: true,
    labelSuffix: 'm',
    landmarkSize: 2,
    numCellsPerAxis: 4,
    showHidden: false,
    centered: true,
});
let activeEffect = 'mask';
let recStatus = false;
let currentRecData = [];
let currentRecWorldData = [];
let recStartTime = 0;
let enableSaveLocal = true;
let enable2DRec = false;
let enable3DRec = true;
let prevTime = 0;
let prevTime_w = 0;
let sendData = false;
let connect = false;

function fetchPost(sendingObj){

    let sendingStr = JSON.stringify(sendingObj);
    console.log(sendingStr);
    console.log(sendingStr.length);

    const fetch_options = {
        method: 'POST',
        body: sendingStr,
        headers: {
            'Content-Type': 'application/json'
        }
    };

    fetch('http://192.168.1.28:3000', fetch_options)
    .then(res => res.json())
    .then(res => console.log(res))
    .catch((error) => {
        console.error('Error: ', error);
    });

}

function postRecordedData() {

    let dstr = Date();
    let idx = dstr.indexOf(":");
    let title = dstr.slice(4, idx + 6);

    if (enableSaveLocal && enable2DRec && enable3DRec) {
        let savingObj = {
            title: title,
            millisec_from_1970_1_1: Date.now(),
            motion_data_2D: currentRecData,
            motion_data_3D: currentRecWorldData,            
            pose_landmarks: mpPose.POSE_LANDMARKS,
            pose_connections: mpPose.POSE_CONNECTIONS
        };

        const fileName = "MotionData_"+title+".json";
        const data = JSON.stringify(savingObj);
        const link = document.createElement("a");
        link.download = fileName;
        link.href = "data:text/plain," + encodeURIComponent(data);
        link.click();
        console.log("hello");

    }

    if (enableSaveLocal && enable2DRec && !enable3DRec) {
        let savingObj = {
            title: title,
            millisec_from_1970_1_1: Date.now(),
            motion_data_2D: currentRecData,
            pose_landmarks: mpPose.POSE_LANDMARKS,
            pose_connections: mpPose.POSE_CONNECTIONS
        };

        const fileName = "MotionData_"+title+".json";
        const data = JSON.stringify(savingObj);
        const link = document.createElement("a");
        link.download = fileName;
        link.href = "data:text/plain," + encodeURIComponent(data);
        link.click();
        console.log("hello");

    }

    if (enableSaveLocal && !enable2DRec && enable3DRec) {
        let savingObj = {
            title: title,
            millisec_from_1970_1_1: Date.now(),
            motion_data_3D: currentRecWorldData,            
            pose_landmarks: mpPose.POSE_LANDMARKS,
            pose_connections: mpPose.POSE_CONNECTIONS
        };

        const fileName = "MotionData_"+title+".json";
        const data = JSON.stringify(savingObj);
        const link = document.createElement("a");
        link.download = fileName;
        link.href = "data:text/plain," + encodeURIComponent(data);
        link.click();
        console.log("hello");

    }
}

function onResults(results) {
    document.body.classList.add('loaded');
    fpsControl.tick();
    if (results.segmentationMask) {
        canvasCtx.drawImage(
        results.segmentationMask, 0, 0, canvasElement.width, canvasElement.height);

        if (activeEffect === 'mask' || activeEffect === 'both') {
            canvasCtx.globalCompositeOperation = 'source-in';
            canvasCtx.fillStyle = '#00FF007F';
        } else {
            canvasCtx.globalCompositeOperation = 'source-out';
            canvasCtx.fillStyle = '#0000FF7F';
            canvasCtx.fillRect(0, 0, canvasElement.width, canvasElement.height);
        }
        canvasCtx.globalCompositeOperation = 'destination-atop';
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);
        canvasCtx.globalCompositeOperation = 'source-over';
    } else {
        canvasCtx.drawImage(results.image, 0, 0, canvasElement.width, canvasElement.height);    //
    }
    if (results.poseLandmarks) {
        drawingUtils.drawConnectors(
        canvasCtx, results.poseLandmarks, mpPose.POSE_CONNECTIONS, { visibilityMin: 0.65, color: 'white' });

        let t = Date.now()-recStartTime;
        if (t > prevTime + 40) {
            let r = results.poseLandmarks;
            let capDataObj = {
                poseLandmarks: r,
                timeOfFrame: t,
                connections: mpPose.POSE_CONNECTIONS,
            }
            
            if (recStatus) currentRecData.push(capDataObj);
            if (sendData) {
                send_message(JSON.stringify(capDataObj));
            }
            prevTime = t;
        }
        drawingUtils.drawLandmarks(
        canvasCtx, Object.values(mpPose.POSE_LANDMARKS_LEFT)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(255,138,0)' });
        drawingUtils.drawLandmarks(
        canvasCtx, Object.values(mpPose.POSE_LANDMARKS_RIGHT)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'rgb(0,217,231)' });
        drawingUtils.drawLandmarks(
        canvasCtx, Object.values(mpPose.POSE_LANDMARKS_NEUTRAL)
            .map(index => results.poseLandmarks[index]), { visibilityMin: 0.65, color: 'white', fillColor: 'white' });
    }
    if (results.poseWorldLandmarks) {
        let t = Date.now()-recStartTime;
        if (t > prevTime_w + 30) {
            let r = results.poseWorldLandmarks;
            let capDataObj = {
                poseWorldLandmarks: r,
                timeOfFrame: t,
                connections: mpPose.POSE_CONNECTIONS,
            }
            if (recStatus) currentRecWorldData.push(capDataObj);
            prevTime_w = t;
        }

        grid.updateLandmarks(results.poseWorldLandmarks, mpPose.POSE_CONNECTIONS, [
            { list: Object.values(mpPose.POSE_LANDMARKS_LEFT), color: 'LEFT' },
            { list: Object.values(mpPose.POSE_LANDMARKS_RIGHT), color: 'RIGHT' },
        ]);
    }
    else {
        grid.updateLandmarks([]);
    }
}

const pose = new mpPose.Pose(options);
pose.onResults(onResults);
console.log(pose);

let prevEnableRec = false;
let prevConnect = false;
let prevSendData = false;

new controls
    .ControlPanel(controlsElement, {
    selfieMode: false,
    modelComplexity: 1,
    smoothLandmarks: true,
    enableSegmentation: false,
    smoothSegmentation: true,
    minDetectionConfidence: 0.5,
    minTrackingConfidence: 0.5,
    effect: 'background',
    enableRec: false,
    enableRec2D: false,
    enableRec3D: true,
    saveLocalFile: true,
    connect: false,
    sendData: false,
})
    .add([
    fpsControl,
    new controls.Toggle({ title: 'Selfie Mode', field: 'selfieMode' }),
    new controls.SourcePicker({
        onSourceChanged: () => {
            pose.reset();
        },
        onFrame: async (input, size) => {       //
            const aspect = size.height / size.width;
            let width, height;
            if (window.innerWidth > window.innerHeight) {
                height = window.innerHeight;
                width = height / aspect;
            }
            else {
                width = window.innerWidth;
                height = width * aspect;
            }
            canvasElement.width = width;
            canvasElement.height = height;
            await pose.send({ image: input });
        },
    }),
    new controls.Slider({
        title: 'Model Complexity',
        field: 'modelComplexity',
        discrete: ['Lite', 'Full', 'Heavy'],
    }),
    new controls.Toggle({ title: 'Smooth Landmarks', field: 'smoothLandmarks' }),
    new controls.Toggle({ title: 'Enable Segmentation', field: 'enableSegmentation' }),
    new controls.Toggle({ title: 'Smooth Segmentation', field: 'smoothSegmentation' }),
    new controls.Slider({
        title: 'Min Detection Confidence',
        field: 'minDetectionConfidence',
        range: [0, 1],
        step: 0.01
    }),
    new controls.Slider({
        title: 'Min Tracking Confidence',
        field: 'minTrackingConfidence',
        range: [0, 1],
        step: 0.01
    }),
    new controls.Slider({
        title: 'Effect',
        field: 'effect',
        discrete: { 'background': 'Background', 'mask': 'Foreground' },
    }),
    new controls.Toggle({ title: 'Recording', field: 'enableRec' }),
    new controls.Toggle({ title: 'Rec 2D', field: 'enableRec2D' }),
    new controls.Toggle({ title: 'Rec 3D', field: 'enableRec3D' }),
    new controls.Toggle({ title: 'Save Local', field: 'saveLocalFile' }),
    new controls.Toggle({ title: 'connect', field: 'connect' }),
    new controls.Toggle({ title: 'Send Data', field: 'sendData' }),
])
    .on(x => {
    const options = x;
    videoElement.classList.toggle('selfie', options.selfieMode);

    if (!prevEnableRec && options.enableRec) {
        console.log("yes! rec turns on!");
        recStatus = true;
        currentRecData = [];
        recStartTime = Date.now();
        prevTime = 0;
        prevTime_w = 0;
    } else if (prevEnableRec && !options.enableRec){
        console.log("yes!, rec turns off!");
        recStatus = false;
        postRecordedData();
    } else {
        // console.log("rec status is the same");
    }

    if (!prevConnect && options.connect) {  //to on
        connectPeer();
        console.log("connect");
    } else if (prevConnect && !options.connect) {   //to off
        console.log("stop connection");
    }

    if (!prevSendData && options.sendData) {  //to on
        sendData = true;
        console.log("start sending");
    } else if (prevSendData && !options.sendData) {   //to off
        sendData = false;
        console.log("stop sending");
    }

    prevSendData = options.sendData;
    prevConnect = options.connect;
    prevEnableRec = options.enableRec;
    enableSaveLocal = options.saveLocalFile;

    enable2DRec = options.enableRec2D;
    enable3DRec = options.enableRec3D;

    activeEffect = x['effect'];
    pose.setOptions(options);
})
