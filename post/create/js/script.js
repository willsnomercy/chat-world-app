import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { getDatabase, ref, set } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js";
import { getStorage, ref as sref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-storage.js";
import { firebaseConfig } from '../../../data/js/config.js';
import { getID } from "../../../data/js/authState.js";

(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getDatabase(app);
    const storage = getStorage(app);
    userLocale.onData.load();

    let lang;

    let currentID = null;
    let image = {
        file: null,
        ext: null
    }
    let fileWait = null;
    const container = document.querySelector('.container');

    const createElement = {
        header() {
            const element = document.createElement('h1');
            element.innerHTML = (`
                <button id="back-dashboard"><i class="fa-solid fa-arrow-left"></i></button>
                ${lang.create_post}
            `);
            container.appendChild(element);

            const back = element.querySelector('#back-dashboard');
            back.onclick = () => window.location.href = window.location.origin + '/dashboard/';
        },
        main() {
            const element = document.createElement('div');
            element.classList.add('form');
            element.innerHTML = (`
                <div class="Post-picture">
                    <button class="action" id="input-picture">
                        <i class="fa-solid fa-image"></i> ${lang.choose}
                    </button>
                    <div class="picture-preview"></div>
                </div>
                <div class="Post-desc">
                    <label for="post-name">${lang.description}:</label>
                    <textarea maxlength="250" type="text" name="post-name" id="post-name" placeholder="${lang.type_here}" maxlength="500"></textarea>
                </div>
                <div class="buttons">
                    <button class="action" id="cancel-post"><i class="fa-duotone fa-circle-x"></i> ${lang.cancel}</button>
                    <button class="action" id="send-post"><i class="fa-duotone fa-circle-check"></i> ${lang.send}</button>
                </div>
            `);

            const inputText = element.querySelector(`textarea#post-name`);
            inputText.onkeyup = () => {
                inputText.value = inputText.value.replace(/^\s+/g, '').replace(/ +(?= )/g,'').replace(/^\n+/g, '').replace(/\n /g, '\n').replace(/\n+(?=\n\n)/g, '');
            }

            const inputPicture = element.querySelector(`#input-picture`);
            inputPicture.onclick = () => addImage(inputPicture);
            
            const inputPreview = element.querySelector(`.picture-preview`);

            const addImage = (inputPicture) => {
                const input = document.createElement('input');
                input.setAttribute('type', 'file');
                input.setAttribute('accept', 'image/*');
                input.click();

                input.onchange = () => {
                    const ext = input.value.slice((Math.max(0, input.value.lastIndexOf(".")) || Infinity) + 1);
                    const valid = ["jpg", "jpeg", "png", "webp"];
                    const file = input.files[0];
                    const ukuran = file.size / 1053818;
                    const bulat = Math.ceil(ukuran * Math.pow(10, 2)) / Math.pow(10, 2);

                    if(!valid.includes(ext.toLowerCase())) return popup.alert(lang.failed_format);
                    if(file.size > 2102394) return popup.alert(`${lang.failed_size_1} ${bulat} ${lang.failed_size_2}`);

                    inputPicture.innerHTML = lang.loading;

                    const reader = new FileReader();
                    reader.readAsDataURL(file);
                    reader.onload = () => {
                        inputPicture.innerHTML = ` <i class="fa-solid fa-image"></i> ${lang.choose}`;
                        popup.confirm({
                            msg: `${lang.continue_with}<br/><img src="${reader.result}" alt="${file.name}" />`,
                            onyes: () => {
                                image.file = file;
                                image.ext = ext;
                                fileWait = file;
                                inputPreview.innerHTML = `<img src="${reader.result}" alt="${file.name}" />`;
                                input.remove();
                                inputText.focus();
                            },
                            onno: () => input.remove()
                        })
                    }
                }
            }

            const cancelBtn = element.querySelector(`#cancel-post`);
            cancelBtn.onclick = () => window.location.href = window.location.origin + '/dashboard/';

            const sendBtn = element.querySelector(`#send-post`);
            sendBtn.onclick = () => {
                try {
                    if(!image.file.type.includes('image')) return popup.alert(lang.please_choose);
                } catch {
                    return popup.alert(lang.please_choose);
                }

                if(inputText.value.length > 250) return popup.alert(`${lang.your_length_1} ${inputText.value.length}<br/>${lang.your_length_2}`);

                const now = new Date().getTime().toString();

                const path = `image/${auth.currentUser.uid}/${now}.${image.ext}`;
                const postUp = uploadBytesResumable(sref(storage, path), image.file);

                const uploadElement = document.createElement("div");
                uploadElement.classList.add("Uploader");
                uploadElement.innerHTML = (`<h1>${lang.uploading}</h1>`);

                container.appendChild(uploadElement);

                postUp.on('state_changed', (snapshot) => {
                    let progress = Math.floor((snapshot.bytesTransferred / snapshot.totalBytes) * 100);
                    if(progress == 100) {
                        uploadElement.innerHTML = (`<h1>${lang.uploading}</h1><h2>100%</h2>`);
                        setTimeout(() => {
                            uploadElement.innerHTML = (`<h1>${lang.uploading}</h1><h2>${lang.processing}</h2>`);
                        }, 250);
                    } else {
                        uploadElement.innerHTML = (`<h1>${lang.uploading}</h1><h2>${progress}%</h2>`);
                    }
                }, (err) => {
                    return popup.alert(err);
                }, () => {
                    let jam = new Date().getUTCHours();
                    if(jam < 10) jam = '0' + jam;
                    let menit = new Date().getUTCMinutes();
                    if(menit < 10) menit = '0' + menit;
                    let tanggal = new Date().getUTCDate();
                    if(tanggal < 10) tanggal = '0' + tanggal;
                    let bulan = new Date().getUTCMonth();
                    bulan = bulan + 1;
                    if(bulan < 10) bulan = '0' + bulan;
                    let tahun = new Date().getUTCFullYear();
                    if(tahun < 10) tahun = '0' + tahun;

                    getDownloadURL(postUp.snapshot.ref).then((imgURL) => {
                        let postData = {
                            owner: currentID,
                            msg: inputText.value.replace(/^\s+/g, '').replace(/ +(?= )/g,'').replace(/^\n+/g, '').replace(/\n /g, '\n').replace(/\n+(?=\n\n)/g, ''),
                            time: parseInt(`7${bulan}${menit}${tahun}${tanggal}${jam}`),
                            photoURL: imgURL,
                            path,
                        }
                        set(ref(db, 'post/' + now), postData).then(() => {
                            uploadElement.remove();
                            popup.alert({msg: lang.uploaded, type: 'info', onyes: () => {
                                userLocale.action.changePage('dashboard_posts');
                                window.location.href = `${window.location.origin}/dashboard/`; }
                            });
                        }).catch((err) => popup.alert(err));
                    })
                })
            }

            container.appendChild(element);
            inputText.focus();
        },
        init() {
            container.innerHTML = '';
            this.header();
            this.main();
        }
    }

    const langCheker = async() => {
        let getLang;
        await fetch('../../data/js/language.json').then((data) => data.json()).then((res) => {
            getLang = res;
        });
        let currentLang;
        if(userLocale.state.last_lang == 'indonesia') {
            currentLang = 'indonesia'
        } else {
            currentLang = 'english';
        }
        lang = getLang[currentLang].Post.Create;
    }

    langCheker();

    onAuthStateChanged(auth, (user) => {
        if(user) {
            getID(user).then((res) => {
                currentID = res;
                createElement.init();
            });
        } else {
            window.location.href = `${window.location.origin}/login/`;
        }
    })

})();