var ui = {
    inputType: {
        title: "Input",
        value: 2,
        values: [["Live Input (5 V peak amplitude)",1], ["Sine Wave (amplitude 5 V)",2], ["Square Wave (amplitude 5 V)",3]]
    },
    freeze: {
        title: "Freeze Live Input",
        value: false,
    },
    freq: {
        title: "Input Wave Frequency",
        value: 250,
        range:[1,1000],
        resolution:1,
        units: "Hz"
    },
    gain: {
        title: "Oscilloscope gain",
        value: 1,
        range:[0,5],
        resolution:0.1,
    },
    dropdownExample: {
        title: "Seconds / div",
        value: 1,
        values: [["50 µs", 0.05],["100 µs", 0.1],["200 µs", 0.2],["500 µs", 0.5],["1 ms", 1], ["2 ms", 2],["5 ms", 5]]
    },
    volts: {
        title: "Volts / div",
        value: 1,
        values: [["1 V", 0.2],["2 V", 0.4],["5 V", 1],["10 V", 2]]
    },
    horizOffset: {
        title: "Horizontal Offset",
        value: 0,
        range:[-100,100],
        resolution:1,
        input: "hidden"
    },
    vertOffset: {
        title: "Vertical Offset",
        value: 0,
        range:[-100,100],
        resolution:1,
        input: "hidden"
    }

};

$(document).on("uiLoaded", function(){
    if (navigator.getUserMedia = (navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia)){
        navigator.getUserMedia( {audio:true}, gotStream,function(error) {
            console.log("Capture error: ", error.code);
        });
    } else {
        animate();
        $(".preamble").append("<div class='alert'>To use Live Audio Input, please download the latest version of Chrome.</div>");
        $("#inputType-interface option[value=1]").attr("disabled", true);
    };

});


function getQueryVariable(variable) {
    var query = window.location.search.substring(1);
    var vars = query.split("&");
    for (var i=0;i<vars.length;i++) {
        var pair = vars[i].split("=");
        if (pair[0] == variable) {
            return pair[1];
        }
    }
}



demo = document.getElementById('demo');
c = document.createElement("canvas"); // for gridlines
c2 = document.createElement("canvas"); // for animated line
var w = window;
screenHeight = w.innerHeight;
screenWidth = w.innerWidth;
c.width = demo.clientWidth;
c.height = document.body.clientHeight;
c.height = c.width * 0.67;
c2.width = demo.clientWidth;
c2.height = document.body.clientHeight;
c2.height = c.height;
$("#demo").height(c.height + 20);
c.style.backgroundColor = "#5db1a2";
demo.appendChild(c);
demo.appendChild(c2);

midPoint = {x: c.width/2, y: c.height/2};

ctx = c.getContext("2d");
ctx2 = c2.getContext("2d");

function createGrid(ctx){
    ctx.beginPath();
    ctx.moveTo(0, midPoint.y);
    ctx.lineTo(c.width, midPoint.y);
    ctx.moveTo(midPoint.x, 0);
    ctx.lineTo(midPoint.x, c.height);
    ctx.strokeStyle = "#196156";
    ctx.lineWidth = '2';
    ctx.globalCompositeOperation = 'source-over';
    ctx.stroke();
    ctx.closePath();

    ctx.beginPath();
    gridLineX = midPoint.x - 100;
    ctx.lineWidth = '2';
    while (gridLineX >= 0){
        ctx.moveTo(gridLineX, 0);
        ctx.lineTo(gridLineX, c.height);
        gridLineX -= 100;
    }
    gridLineX = midPoint.x + 100;
    while (gridLineX <= c.width){
        ctx.moveTo(gridLineX, 0);
        ctx.lineTo(gridLineX, c.height);
        gridLineX += 100;
    }
    gridLineY = midPoint.y - 100;
    while (gridLineY >= 0){
        ctx.moveTo(0, gridLineY);
        ctx.lineTo(c.width, gridLineY);

        gridLineY -= 100;
    }
    gridLineY = midPoint.y + 100;
    while (gridLineY <= c.height){
        ctx.moveTo(0, gridLineY);
        ctx.lineTo(c.width, gridLineY);
        gridLineY += 100;
    }
    dashesX = midPoint.x - 20;
    while (dashesX >= 0){
        ctx.moveTo(dashesX, midPoint.y-5);
        ctx.lineTo(dashesX, midPoint.y+5);
        dashesX -= 20;
    }
    while (dashesX <= c.width){
        ctx.moveTo(dashesX, midPoint.y-5);
        ctx.lineTo(dashesX, midPoint.y+5);
        dashesX += 20;
    }
    dashesY = midPoint.y - 20;
    while (dashesY >= 0){
        ctx.moveTo(midPoint.x-5, dashesY);
        ctx.lineTo(midPoint.x+5, dashesY);
        dashesY -= 20;
    }
    dashesY = midPoint.y + 20;
    while (dashesY <= c.height){
        ctx.moveTo(midPoint.x-5, dashesY);
        ctx.lineTo(midPoint.x+5, dashesY);
        dashesY += 20;
    }

    ctx.stroke();

}

createGrid(ctx);

var isRunning = false;

function update(el){

    if (el == 'inputType' && ui.inputType.value == 1){
        streaming = true;
        animate();
        animateId = window.requestAnimationFrame(animate);

    } else if (el == 'inputType' && ui.inputType.value != 1){
        //cancel animation
        streaming = false;
        window.cancelAnimationFrame(animateId);
        drawData();
    } else if (streaming == true && ui.freeze.value == false){
        animate();
    }
    else {
        drawData();
    }
}


var AudioContext = (window.AudioContext || window.webkitAudioContext || window.mozAudioContext || window.oAudioContext || window.msAudioContext);

if (AudioContext){
    var audioContext = new AudioContext();
    var gainNode = audioContext.createGain();
    var analyser = audioContext.createAnalyser();
    gainNode.gain.value = 3;
    analyser.smoothingTimeConstant = .9;
    try {
        analyser.fftSize = 4096;
    } catch(e) {
        analyser.fftSize = 2048;
    }
    gainNode.connect(analyser);
    var timeDomain = new Uint8Array(analyser.frequencyBinCount);
    var streaming = false;
    var sampleRate = audioContext.sampleRate;
    var numSamples = analyser.frequencyBinCount;
} else {
    var analyser = {};
    analyser.frequencyBinCount = 512;
}


function gotStream(stream) {
    window.mediaStreamSource = audioContext.createMediaStreamSource( stream );
    var osc = audioContext.createOscillator();
    osc.frequency.value = 200;
    osc.start(0);
    window.mediaStreamSource.connect(gainNode);
    streaming = true;
    $('#inputType-interface select').val(1).change();
    animate();
}

$(document).on("change", '#inputType-interface select', function(){
    if ($(this).val() == 1){
        streaming = true;
        $('#freq-interface').attr('disabled', 'disabled').addClass("disabled");
    } else {
        streaming = false;
        $('#freq-interface').removeAttr('disabled').removeClass("disabled");
    }
});


var mapRange = function(from, to, s) {
    return to[0] + (s - from[0]) * (to[1] - to[0]) / (from[1] - from[0]);
};


var animateId;
var previousTranslate = {x:0, y:0};

function animate(){
    if (streaming == true && ui.freeze.value == false){
        analyser.getByteTimeDomainData(timeDomain);
        window.requestAnimationFrame(animate);
    }
    drawData();
}

function drawData(){

    ctx2.translate(-previousTranslate.x, -previousTranslate.y);
    ctx2.clearRect(0,0,c.width,c.height);
    ctx2.translate(ui.horizOffset.value, ui.vertOffset.value);
    ctx2.beginPath();
    ctx2.strokeStyle = '#befde5';
    ctx2.lineWidth = 1;

    for (var i = -analyser.frequencyBinCount/2; i <= analyser.frequencyBinCount/2; i++) {
        index = i+analyser.frequencyBinCount/2;
        if (streaming == true){

            //var height = c.height * timeDomain[i] / 256;
            //var offset = c.width * (analyser.frequencyBinCount/(analyser.frequencyBinCount-1)) * i/analyser.frequencyBinCount;
            //var xc = i * (c.width/analyser.frequencyBinCount);
            //var yc = ui.gain.value * ((timeDomain[index] / 255) - 0.5)*200/(ui.volts.value);
            //yc += c.height/2;
            //xc = mapRange([0, 0.001*ui.dropdownExample.value], [0, 100 * (numSamples/sampleRate) / c.width], xc);
            //xc += c.width/2;
            //ctx2.lineTo(xc, yc);

            var height = c.height * timeDomain[i] / 256
            var offset = c.width * (analyser.frequencyBinCount/(analyser.frequencyBinCount-1)) * i/analyser.frequencyBinCount;
            var xc = i * (c.width/analyser.frequencyBinCount);
            var yc = ui.gain.value * ((timeDomain[index] / 255) - 0.5)*200/(ui.volts.value);

            yc += c.height * Math.random();
            yc *= ui.gain.value;
            xc = mapRange([0, 0.001*ui.dropdownExample.value], [0, 100 * (numSamples/sampleRate) / c.width], xc);
            xc += c.width/2;
            ctx2.lineTo(xc, yc);

        } else {

            var xc = i * (c.width/analyser.frequencyBinCount);
            scaledRangeValue = mapRange([1,2], [1,3], ui.dropdownExample.value);
            var amplitude = 100 / ui.volts.value;
            var yc =  -amplitude * Math.sin(2*Math.PI*xc*ui.freq.value*0.00001*ui.dropdownExample.value); //0.00001 is the number of seconds we want a pixel to represent, ie 1ms / 100

            if (ui.inputType.value == 3){
                if (yc > 0) yc = amplitude;
                else yc = -amplitude;
            }

            yc *= ui.gain.value;
            yc = c.height/2 + yc;
            xc += c.width/2;
            ctx2.lineTo(xc, yc);

        }

        previousTranslate = {x:ui.horizOffset.value,y:ui.vertOffset.value}

    }

    ctx2.stroke();
    ctx2.strokeStyle = 'rgba(174,244,218,0.3)';
    ctx2.lineWidth = 3;
    ctx2.stroke();
    ctx2.strokeStyle = 'rgba(174,244,218,0.3)';
    ctx2.lineWidth = 4;
    ctx2.stroke();
}

animate();