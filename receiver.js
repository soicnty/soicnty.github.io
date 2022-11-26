const canvas = document.querySelector('#SimpleCanvas');
const showDataInConsole = document.querySelector('#showDatainConsole');
const framerate = document.querySelector("#framerate");
let bShowDataInConsole = false;
let bShowFarmerate = false;
let frRateArray = [];
let currentRMFrame = 0;     // using this to calculate running mean as id for frRateArray.
let prevTime = 0;
let senderName;
let peer;
let connect;


document.addEventListener("dragover", function(event) {
    event.preventDefault();
});  

const body = document.querySelector('body');

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
            
            peer.on('connection', conn=>{
                console.log('他のクライアントからの接続あり')
                connect = conn;
                if (connect) console.log("connected1:");
                else console.log("not1")
                console.log(connect);
                conn.on('data', data => {
                    let dd = JSON.parse(data);
                    if (bShowDataInConsole) console.log(dd);
                    draw(dd);
                });
            });

        }
        fr.readAsText(f);       //ここで読んで、
    }
})

function connectPeerServer(settings) {
    const peerSv = new Peer(settings.receiver.peerName, {
        host: settings.receiver.host,
        port: settings.receiver.port,
        path: settings.receiver.path,
    });
    senderName = settings.sender.peerName;
    return peerSv;
}


// const peer = new Peer('receiver_1', {
//     host: 'telemersive.ycam.jp',
//     port: 9000,
//     path: '/myapp'
// });

// const peer = new Peer();


function calcFramerate() {
    const currentTime = Date.now();
    framerate.textContent = 1/((currentTime-prevTime)/1000);
    prevTime = currentTime;

}

function send_message(){
    if (connect) connect.send('test');
    console.log('hello');
}

console.log("before connection");
console.log(connect);
if (connect) console.log("connected2:");
    else console.log("not2")

function draw(data) {

    if ( ! canvas || ! canvas.getContext ) {
        return false;
    }

    const context = canvas.getContext('2d');

    let width = context.canvas.width;
    let height = context.canvas.height;
    let posPose = data.poseLandmarks;
    let connections = data.connections;

    context.strokeStyle = '#FFF';
    context.clearRect(0, 0, width, height);

    context.beginPath();
    for (const linePoints of connections) {
        let x0 = Math.floor(posPose[linePoints[0]].x * width);
        let y0 = Math.floor(posPose[linePoints[0]].y * height);
        let x1 = Math.floor(posPose[linePoints[1]].x * width);
        let y1 = Math.floor(posPose[linePoints[1]].y * height);
        context.moveTo(x0,y0);
        context.lineTo(x1,y1);
    }
    context.stroke();
}

showDataInConsole.addEventListener('change', (e)=> {
    bShowDataInConsole = e.target.checked;
});

canvas.width = window.innerWidth;       // can be "canvas.style.width = window.innerWidth + 'px';"
canvas.height = window.innerHeight;

window.addEventListener('resize', ()=>{
    // console.log("onresize");
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px'; // can be "canvas.height = window.innerHeight;"
});
