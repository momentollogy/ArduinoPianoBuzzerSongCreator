function updateSliderValue(value) {
    sliderValue = parseInt(value);
}

// Create a Web Audio API context
const audioContext = new(window.AudioContext || window.webkitAudioContext)();

// Frequencies for the piano keys (C4 to C5)
const frequencies = {
    192: 220.00, // ` (next to the 1 key)
    49: 233.08, // 1
    81: 246.94, // Q
    65: 261.63, // A
    87: 277.18, // W
    83: 293.66, // S
    69: 311.13, // E
    68: 329.63, // D
    70: 349.23, // F
    84: 369.99, // T
    71: 392.00, // G
    89: 415.30, // Y
    72: 440.00, // H
    85: 466.16, // U
    74: 493.88, // J
    75: 523.25, // K
    79: 554.37, // O
    76: 587.33, // L
    80: 622.25, // P
    59: 659.26, // ;
    222: 698.26, // ;
    221: 739.99, // ]
    220: 783.99, // \


};

const noteNames = {
    220.00: "NOTE_A3",
    233.08: "NOTE_As3",
    246.94: "NOTE_B3",
    261.63: "NOTE_C4",
    277.18: "NOTE_Cs4",
    293.66: "NOTE_D4",
    311.13: "NOTE_Ds4",
    329.63: "NOTE_E4",
    349.23: "NOTE_F4",
    369.99: "NOTE_Fs4",
    392.00: "NOTE_G4",
    415.30: "NOTE_Gs4",
    440.00: "NOTE_A4",
    466.16: "NOTE_As4",
    493.88: "NOTE_B4",
    523.25: "NOTE_C5",
    554.37: "NOTE_Cs5",
    587.33: "NOTE_D5",
    622.25: "NOTE_Ds5",
    659.26: "NOTE_E5",
    698.26: "NOTE_F5",
    739.99: "NOTE_Fs5",
    783.99: "NOTE_G5",

};

//THIS IS TO map the note names to the key codes for load button. 
const noteToKeyCode = {
    'NOTE_A3': 192,
    'NOTE_As3': 49,
    'NOTE_B3': 81,
    'NOTE_C4': 65,
    'NOTE_Cs4': 87,
    'NOTE_D4': 83,
    'NOTE_Ds4': 69,
    'NOTE_E4': 68,
    'NOTE_F4': 70,
    'NOTE_Fs4': 84,
    'NOTE_G4': 71,
    'NOTE_Gs4': 89,
    'NOTE_A4': 72,
    'NOTE_As4': 85,
    'NOTE_B4': 74,
    'NOTE_C5': 75,
    'NOTE_Cs5': 79,
    'NOTE_D5': 76,
    'NOTE_Ds5': 80,
    'NOTE_E5': 59,
    'NOTE_F5': 222,
    'NOTE_Fs5': 221,
    'NOTE_G5': 220,

};

//Makes blackkeynames work
const keyNames = {
    49: '1',
    81: 'Q',
    87: 'W',
    69: 'E',
    84: 'T',
    89: 'Y',
    85: 'U',
    79: 'O',
    80: 'P',
    221: ']',
};

document.querySelectorAll('.key.black').forEach((key) => {
    const keyCode = key.getAttribute('data-note');
    key.innerText = keyNames[keyCode] || key.innerText;
});



let playingNotes = new Set();
let sliderValue = 0.5;

function updateSliderValue(value) {
    sliderValue = parseFloat(value);
}

// Map DURATION TO NOTE LENGTH
function mapDurationToNoteLength(duration, isRest) {
    const noteLengths = {
        108: "NOTE_THIRTY_SECOND",
        216: "NOTE_SIXTEENTH",
        324: "NOTE_EIGHTH",
        486: "NOTE_DOTTED_EIGHTH",
        648: "NOTE_QUARTER",
        972: "NOTE_DOTTED_QUARTER",
        1296: "NOTE_HALF",
        2592: "NOTE_WHOLE",
    };

    if (!isRest) {
        if (sliderValue >= 1) {
            delete noteLengths[108]; // Remove 32nd notes based on the slider value
        }
        if (sliderValue >= 2) {
            delete noteLengths[216]; // Remove 16th notes based on the slider value
        }
    }

    let closestDuration = Object.keys(noteLengths).reduce((prev, curr) => {
        return Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev;
    });

    return noteLengths[closestDuration];
}



// Function to play a note
function playNote(frequency, keyElement, onStop) {
    const oscillator = audioContext.createOscillator();
    oscillator.type = 'sine'; // Wave type
    oscillator.frequency.value = frequency;
    oscillator.connect(audioContext.destination);
    oscillator.start();

    const startTime = audioContext.currentTime * 1000;

    // Add the pressed state for the key
    keyElement.classList.add('pressed');

    const handleMouseUp = () => {
        oscillator.stop();
        keyElement.classList.remove('pressed');
        keyElement.removeEventListener('mouseup', handleMouseUp);
        const duration = (audioContext.currentTime * 1000) - startTime;
        playingNotes.delete(Number(keyElement.dataset.note)); // remove key code from playingNotes Set
        recordingNote = false; // reset recordingNote flag
        if (onStop) onStop(duration);
    };

    keyElement.addEventListener('mouseup', handleMouseUp);

    return oscillator;
}


let isPlaying = false;

// Play event listener
document.getElementById('play').addEventListener('click', async () => {
    if (isPlaying) return;

    isPlaying = true;
    document.getElementById('stop').disabled = false;
    await playRecordedNotes(recordedNotes).then(() => {
        document.getElementById('stop').disabled = true;
        isPlaying = false;
    });
});



let currentOscillator = null; // Add this line

// Play and record function
function playAndRecord(frequency, keyElement) {
    const playAndRecordCallback = (duration) => {
        recordingNote = false;
        if (recording) {
            if (!recordingStartTime) {
                recordingStartTime = new Date().getTime();
            }
            const restDuration = (new Date().getTime() - recordingStartTime) - duration;
            if (restDuration > 0) {
                recordedNotes.push({
                    rest: true,
                    duration: restDuration
                });
            }
            recordedNotes.push({
                frequency: frequency,
                duration: duration,
                startTime: new Date().getTime()
            });
            recordingStartTime = new Date().getTime();
        }
    };

    if (recordingNote) {
        const currentKeyCode = Array.from(playingNotes)[0];
        const currentKeyElement = document.querySelector(`.key[data-note="${currentKeyCode}"]`);
        if (currentKeyElement) {
            currentKeyElement.dispatchEvent(new MouseEvent('mouseup'));
        }
    }

    playNote(frequency, keyElement, playAndRecordCallback);
    recordingNote = true;
}




// PLAYRECORDED NOTES FUNCTION
async function playRecordedNotes(notes) {
    stopPlaybackRequested = false;
    const timeBetweenNotesMs = 0;
    const playbackTempo = parseInt(document.getElementById("playback-tempo").value);
    const tempoFactor = 92.6 / playbackTempo; // Calculate the tempo factor based on the default BPM (92.6) and the playback tempo

    // Disable the "Play" button while the song is playing
    const playButton = document.getElementById('play');
    playButton.disabled = true;

    for (const note of notes) {
        if (stopPlaybackRequested) {
            break;
        }

        if (note.rest) {
            const restDurationMs = noteLengthsMs[mapDurationToNoteLength(note.duration, true)];
            await new Promise(resolve => setTimeout(resolve, restDurationMs * tempoFactor + timeBetweenNotesMs));
        } else {
            const keyElement = document.querySelector(`.key[data-note="${getKeyCodeForFrequency(note.frequency)}"]`);

            if (!keyElement) {
                console.error('Could not find key element for note:', note);
                continue;
            }

            const oscillator = playNote(note.frequency, keyElement, () => {
                if (stopPlaybackRequested) {
                    oscillator.stop();
                }
            });
            playbackOscillators.push(oscillator);

            const noteDurationMs = noteLengthsMs[mapDurationToNoteLength(note.duration, false)];
            await new Promise(resolve => {
                const timeout = setTimeout(() => {
                    if (!stopPlaybackRequested) {
                        oscillator.stop();
                        keyElement.classList.remove("pressed");
                    }
                    resolve();
                }, noteDurationMs * tempoFactor - 50);
                playbackTimeouts.push(timeout);
            });

            await new Promise(resolve => setTimeout(resolve, timeBetweenNotesMs));
        }
    }

    // Re-enable the "Play" button when the song stops playing
    playButton.disabled = false;
}




function releaseAllKeys() {
    const pianoKeys = document.querySelectorAll('.key.pressed');
    pianoKeys.forEach(key => {
        key.classList.remove('pressed');
    });
}

function stopPlayback() {
    stopPlaybackRequested = true;

    // Clear all timeouts
    for (const timeout of playbackTimeouts) {
        clearTimeout(timeout);
    }

    // Stop all oscillators
    for (const oscillator of playbackOscillators) {
        oscillator.stop();
    }

    // Reset arrays
    playbackTimeouts = [];
    playbackOscillators = [];

    isPlaying = false; // Add this line

    // Release all pressed keys
    releaseAllKeys();
}


//event listner for mouse click on keys
const pianoKeys = document.querySelectorAll('.key');

pianoKeys.forEach(key => {
    key.addEventListener('mousedown', () => {
        const keyCode = key.dataset.note;
        if (!playingNotes.has(keyCode)) {
            playingNotes.add(keyCode);
            playAndRecord(frequencies[keyCode], key);
        }
    });

    key.addEventListener('mousemove', (event) => {
        if (event.buttons === 1) { // Check if the left mouse button is pressed
            const keyCode = key.dataset.note;
            if (!playingNotes.has(keyCode)) {
                playingNotes.add(keyCode);
                playAndRecord(frequencies[keyCode], key);
            }
        }
    });

    key.addEventListener('mouseleave', () => {
        const keyCode = key.dataset.note;
        if (playingNotes.has(keyCode)) {
            playingNotes.delete(keyCode);
            key.dispatchEvent(new MouseEvent('mouseup'));
        }
    });
});



//Funtion to add a rest
function addRestIfNeeded() {
    if (recordedNotes.length > 1) {
        const previousNote = recordedNotes[recordedNotes.length - 2];
        const restDuration = (recordedNotes[recordedNotes.length - 1].startTime) - (previousNote.startTime + previousNote.duration);
        if (restDuration > 0) {
            recordedNotes.splice(recordedNotes.length - 1, 0, {
                rest: true,
                duration: restDuration
            });
        }
    }
}


let recording = false;
let playing = false;
let startTime = null;
let recordedNotes = [];
let recordingNote = false;
let recordingStartTime;

// Start recording
document.getElementById('record').addEventListener('click', () => {
    recording = true;
    startTime = Date.now();
    recordedNotes = [];
    recordingStartTime = null;
    document.getElementById('record').disabled = true;
    document.getElementById('stop').disabled = false;
});

function stopPlayback() {
    stopPlaybackRequested = true;

    // Clear all timeouts
    for (const timeout of playbackTimeouts) {
        clearTimeout(timeout);
    }

    // Stop all oscillators
    for (const oscillator of playbackOscillators) {
        oscillator.stop();
    }

    // Reset arrays
    playbackTimeouts = [];
    playbackOscillators = [];

    isPlaying = false; // Add this line
}


// Stop recording
document.getElementById('stop').addEventListener('click', () => {
    recording = false;
    startTime = null;
    document.getElementById('record').disabled = false;
    document.getElementById('stop').disabled = true;
    displayRecording();
    stopMetronome();

    // Call stopPlayback() if either recording or playing
    if (recording || isPlaying) {
        stopPlayback();
        document.getElementById('play').disabled = false;
    }
});




// Clear button
document.getElementById('clear').addEventListener('click', () => {
    recordedNotes = [];
    document.getElementById("recording").innerHTML = "";
});


// Rest function
function addRest() {
    if (recording) {
        const currentTime = new Date().getTime();
        const restDuration = currentTime - recordingStartTime;
        if (restDuration >= 100) {
            recordedNotes.push({
                rest: true,
                duration: restDuration
            });
        }
        recordingStartTime = currentTime;
    }
}

const keyCodes = {
    "Semicolon": 59,
    'Quote': 222
};

document.addEventListener('keydown', event => {
    const keyCode = keyCodes[event.code] || event.keyCode;
    const keyElement = document.querySelector(`.key[data-note="${keyCode}"]`);

    if (keyElement && !playingNotes.has(keyCode)) {
        playingNotes.add(keyCode);
        playAndRecord(frequencies[keyCode], keyElement);
    }
});

document.addEventListener('keyup', event => {
    const keyCode = keyCodes[event.code] || event.keyCode;
    const keyElement = document.querySelector(`.key[data-note="${keyCode}"]`);

    if (keyElement) {
        playingNotes.delete(keyCode);
        keyElement.dispatchEvent(new MouseEvent('mouseup'));
    }
});


// Display recording function
function displayRecording() {
    let output = "";
    const songTitle = document.getElementById("song-title").value;
    const notesCount = recordedNotes.length;

    output += `${songTitle}[${notesCount}][2] =\n{\n`;

    recordedNotes.forEach((note, index) => {
        if (note.rest) {
            output += `  {0, ${mapDurationToNoteLength(note.duration, true)}},\n`;
        } else {
            output += `  {${noteNames[note.frequency]}, ${mapDurationToNoteLength(note.duration)}},\n`;
        }
    });

    output += "};";

    const recordingElement = document.getElementById("recording");
    recordingElement.innerHTML = `<button id="copy-song">Copy Song</button><pre>${output}</pre>`;

    const copySongButton = document.getElementById("copy-song");
    copySongButton.addEventListener("click", () => copySongToClipboard(output));
}


function getKeyCodeForFrequency(frequency) {
    for (const [keyCode, freq] of Object.entries(frequencies)) {
        if (freq === frequency) {
            return keyCode;
        }
    }
    return null;
}

let playbackTimeouts = [];
let playbackOscillators = [];


const noteLengthsMs = {
    "NOTE_THIRTY_SECOND": 108,
    "NOTE_SIXTEENTH": 216,
    "NOTE_EIGHTH": 324,
    "NOTE_DOTTED_EIGHTH": 486,
    "NOTE_QUARTER": 648,
    "NOTE_DOTTED_QUARTER": 972,
    "NOTE_HALF": 1296,
    "NOTE_WHOLE": 2592,
};




// LOAD SONG EVENT LISTENER
document.getElementById('loadSongButton').addEventListener('click', loadSongFromInput);


// LOAD SONG FUNCTION
function loadSongFromInput() {
    const songString = document.getElementById('songInput').value;
    console.log('Song string:', songString);

    const regex = /{([^}]+)}/g;
    const rawSongData = songString.match(regex);

    if (!rawSongData) {
        alert('Invalid song format. Please make sure the input is correct.');
        return;
    }

    const songArray = rawSongData.map((item) => {
        const cleanedItem = item.replace(/[{}]/g, '');
        const values = cleanedItem.split(',').map((val) => val.trim());
        return [values[0], values[1]];
    });

    console.log('Song array:', songArray);

    const loadedSong = songArray.map(([note, duration]) => {
        const keyCode = noteToKeyCode[note];
        const noteDuration = noteLengthsMs[duration];
        return {
            frequency: note === '0' ? 0 : frequencies[keyCode],
            duration: noteDuration,
            durationString: duration,
            rest: note === '0',
        };
    });

    console.log('Loaded song:', loadedSong);
    displayLoadedSong(loadedSong);
    recordedNotes = loadedSong; // Update the recordedNotes with the loaded song data
}

//CLEAR ARRAY
function clearSongArray() {
    document.getElementById('songInput').value = '';
}



//DISPLAY LOADED SONG FUNCTION
function displayLoadedSong(songArray) {
    let output = "";
    const songTitle = document.getElementById("song-title").value;
    const notesCount = songArray.length;

    output += `${songTitle}[${notesCount}][2] =\n{\n`;

    songArray.forEach((noteObject) => {
        const note = noteObject.rest ? '0' : noteNames[noteObject.frequency];
        const duration = noteObject.durationString; // Use the original duration string
        output += `  {${note}, ${duration}},\n`;
    });

    output += "};";

    const recordingElement = document.getElementById("recording");
    recordingElement.innerHTML = `<button id="copy-song">Copy Song</button><pre>${output}</pre>`;

    const copySongButton = document.getElementById("copy-song");
    copySongButton.addEventListener("click", () => copySongToClipboard(output));
}



//QUANTIZE  STUFF
function closestDuration(duration, supportedDurations) {
    return supportedDurations.reduce((prev, curr) =>
        Math.abs(curr - duration) < Math.abs(prev - duration) ? curr : prev
    );
}

function quantizeNoteDuration(duration) {
    const supportedDurations = [108, 216, 324, 486, 648, 972, 1296, 2592];
    return closestDuration(duration, supportedDurations);
}

function quantizeRestDuration(duration) {
    const supportedDurations = [108, 216, 324, 486, 648, 972, 1296, 2592];
    return closestDuration(duration, supportedDurations);
}

// Example usage
let noteDuration = 0.37; // Example note duration value
let quantizedNoteDuration = quantizeNoteDuration(noteDuration);
console.log(quantizedNoteDuration); // output: 324 (closest to an eighth note)

let restDuration = 0.185; // Example rest duration value
let quantizedRestDuration = quantizeRestDuration(restDuration);
console.log(quantizedRestDuration); // output: 216 (closest to a sixteenth note)




//METRONOME STUFF

let metronomeInterval = null;

function createWhiteNoise() {
    const bufferSize = 4096;
    const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
    const output = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
    }

    const whiteNoiseSource = audioContext.createBufferSource();
    whiteNoiseSource.buffer = buffer;
    whiteNoiseSource.loop = true;

    return whiteNoiseSource;
}

function startMetronome(bpm) {
    const interval = 60 / bpm * 1000;

    // Disable the "Start Metronome" button when the metronome starts
    const startMetronomeButton = document.getElementById('start-metronome');
    startMetronomeButton.disabled = true;

    metronomeInterval = setInterval(() => {
        const whiteNoiseSource = createWhiteNoise();
        const gainNode = audioContext.createGain();
        gainNode.gain.value = 0.2;

        const filterNode = audioContext.createBiquadFilter();
        filterNode.type = 'bandpass';
        filterNode.frequency.value = 2000;
        filterNode.Q.value = 0.5;

        whiteNoiseSource.connect(gainNode);
        gainNode.connect(filterNode);
        filterNode.connect(audioContext.destination);

        whiteNoiseSource.start();
        setTimeout(() => {
            whiteNoiseSource.stop();
        }, 50);
    }, interval);
}

function stopMetronome() {
    if (metronomeInterval) {
        clearInterval(metronomeInterval);
        metronomeInterval = null;
    }

    // Re-enable the "Start Metronome" button when the metronome stops
    const startMetronomeButton = document.getElementById('start-metronome');
    startMetronomeButton.disabled = false;
}

//METRONOME EVENT LISTENER
document.getElementById("start-metronome").addEventListener("click", () => {
    const bpm = parseInt(document.getElementById("metronome-bpm").value, 10);
    startMetronome(bpm);
});

document.getElementById("stop-metronome").addEventListener("click", () => {
    stopMetronome();
});




//COPYSONG TO CLIPBOARTD FUNCTION
function copySongToClipboard(songString) {
    const songElement = document.createElement('textarea');
    songElement.value = songString;
    document.body.appendChild(songElement);
    songElement.select();
    document.execCommand('copy');
    document.body.removeChild(songElement);
    alert('Song copied to clipboard');
}