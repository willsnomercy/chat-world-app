class DevankaAudio extends HTMLElement{
    constructor() {
        let isPlayed = false;
        let isPaused = false;
        super();
        const suara = new Audio();
        suara.src = this.getAttribute("src");

        const putarDiv = document.createElement("div");
        putarDiv.classList.add("putar");

        const berhentiDiv = document.createElement("div");
        berhentiDiv.classList.add("berhenti");


        const durasiDiv = document.createElement("div");
        durasiDiv.classList.add("durasi");

        const duRange = document.createElement("input");
        duRange.setAttribute("type", "range");
        duRange.setAttribute("max", "100");
        duRange.setAttribute("min", "0");
        duRange.setAttribute("step", "0");
        duRange.setAttribute("value", "0");

        const duText = document.createElement("div");
        duText.classList.add("duTulisan");
        duText.innerHTML = (`--:--/--:--`);

        durasiDiv.appendChild(duRange);
        durasiDiv.appendChild(duText);

        suara.ontimeupdate = () => {
            let duMenit = Math.floor(suara.duration / 60);
            let duDetik = Math.floor(suara.duration - duMenit * 60);
            let nwMenit = Math.floor(suara.currentTime / 60);
            let nwDetik = Math.floor(suara.currentTime - nwMenit * 60);

            let customDuMenit = "00:00";
            let customDuDetik = "00:00";
            let customNwMenit = "00:00";
            let customNwDetik = "00:00";

            duMenit < 10 ? customDuMenit = `0${duMenit}` : customDuMenit = duMenit;
            duDetik < 10 ? customDuDetik = `0${duDetik}` : customDuDetik = duDetik;
            nwMenit < 10 ? customNwMenit = `0${nwMenit}` : customNwMenit = nwMenit;
            nwDetik < 10 ? customNwDetik = `0${nwDetik}` : customNwDetik = nwDetik;
            duText.innerHTML = `${customNwMenit}:${customNwDetik}/${customDuMenit}:${customDuDetik}`;

            let durasi = Math.floor(suara.currentTime / suara.duration * 100);
            if(isPaused === false) {
                duRange.value = durasi;
            }
        }
        
        duRange.onmousedown = () => {
            isPaused = true;
        }
        duRange.onmouseup = () => {
            let durasi  = Math.floor(duRange.value * suara.duration / 100);
            suara.currentTime = durasi;
            isPaused = false;
            if(isPlayed === true) suara.play();
        }

        suara.onended = () => {
            isPlayed = false;
            suara.currentTime = 0;
            putarDiv.classList.remove("active");
        }

        putarDiv.onclick = () => {
            if(isPlayed === false) {
                isPlayed = true;
                suara.play();
                putarDiv.classList.add("active");
            } else {
                isPlayed = false;
                suara.pause();
                putarDiv.classList.remove("active");
            }
        }

        berhentiDiv.onclick = () => {
            isPlayed = false;
            suara.pause();
            suara.currentTime = 0;
            putarDiv.setAttribute("class", "putar");
        }



        this.appendChild(putarDiv);
        this.appendChild(durasiDiv);
        this.appendChild(berhentiDiv);
    }
}

(function() {
    customElements.define("devanka-audio", DevankaAudio);
}());
