import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged} from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { getDatabase, ref, get } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-database.js";
import { firebaseConfig } from '../../data/js/config.js';
import { getID } from "../../../data/js/authState.js";

(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    const db = getDatabase(app);
    userLocale.onData.load();
    let lang;

    let currentID = null;
    const container = document.querySelector('.container');

    const urlParam = new URLSearchParams(window.location.search);
    let urlResult = urlParam.get('gid') || 'gagal';

    const getURL = () => {
        if(urlResult == 'gagal') {
            container.innerHTML = lang.something_wrong;
        } else {
            getUserID(urlResult);
        }
    }

    const getUserID = (id) => {
        if(id == currentID) return window.location.href = window.location.origin + '/user/setting/';

        get(ref(db, 'users/' + id)).then((data) => {
            try {
                createElement.init(data.val(), data.key);
            } catch {
                container.innerHTML = lang.user_not_found;
            }
        })
    }

    const createElement = {
        header() {

            const element = document.createElement('h1');
            element.innerHTML = (`
                <button id="back-dashboard"><i class="fa-solid fa-arrow-left"></i></button>
                ${lang.user_detail}
            `);
            container.appendChild(element);

            const back = element.querySelector('#back-dashboard');
            back.onclick = () => window.location.href = window.location.origin + '/dashboard/';
        },
        main(s, id) {

            const element = document.createElement('div');
            element.classList.add('form');
            element.innerHTML = (`
                <div class="User-name">
                    <h2 data-user="username">Loading</h2>
                    <p data-user="gid">Loading</p>
                </div>
                <div class="User-picture" data-user="picture"></div>
                <div class="bio">
                    <p data-user="about"></p>
                </div>
                <div class="User-link"></div>
                <div class="buttons">
                    <button class="action" data-key="${id}">
                    <i class="fa-duotone fa-comments"></i> Chat
                    </button>
                </div>
            `);

            let uname = s.username || s.displayName;
            let upict = s.pictureURL || s.photoURL;

            const profileUsername = element.querySelector(`[data-user="username"]`);
            const profileGlobalID = element.querySelector(`[data-user="gid"]`);
            const profilePicture = element.querySelector(`[data-user="picture"]`);
            const profileAbout = element.querySelector(`[data-user="about"]`);
            
            profileUsername.innerText = uname;
            profileGlobalID.innerText = `Global ID: ${id}`;
            profilePicture.style.backgroundImage = `url(${upict})`;

            const lowerLength = (bio, wider, n = 0) => {
                const readMore = document.createElement('a');
                readMore.textContent = lang.read_more;
                readMore.style.textDecoration = 'underline';
                readMore.style.cursor = 'pointer';

                if(wider === false) {
                    let newBio = bio.replace(/\n/g, ' ').substring(0, 20);
                    profileAbout.innerText = `${newBio}... `;
                    profileAbout.append(readMore);
                    n++;
                    readMore.onclick = () => lowerLength(bio, true, n);
                } else {
                    profileAbout.innerText = `${bio}\n`;
                    readMore.innerHTML = lang.read_less;
                    profileAbout.append(readMore);
                    n++;
                    readMore.onclick = () => lowerLength(bio, false, n);
                }
            }

            const checkLength = (bio) => {
                if(bio) {
                    if(bio.includes('\n')) {
                        const line_break = Array.from(bio);
    
                        let count = 0;
                        line_break.forEach((a) => {
                            if(a == '\n') count++;
                        });
                        if(count > 3) {
                            lowerLength(bio, false);
                        } else {
                            profileAbout.innerText = `${bio}`;
                        }
                    } else {
                        profileAbout.innerText = `${bio}`;
                    }
                } else {
                    profileAbout.innerHTML = `<i>${lang.hey_there}</i>`;
                }
            }
            checkLength(s.about);

            const chatBtn = element.querySelector(`[data-key="${id}"]`);
            chatBtn.onclick = () => window.location.href = `${window.location.origin}/chat/?r=user&gid=${id}`;


            // User-link
            const uLink = element.querySelector(`.User-link`);
            const socialLinks = () => {
                if(s.github) {
                    const sc = document.createElement('button');
                    sc.classList.add('action');
                    sc.innerHTML = `<i class="fa-brands fa-github c-white"></i> GitHub`;
                    sc.onclick = () => window.open(`https://github.com/${s.github}`);
                    uLink.append(sc);
                }
                if(s.youtube) {
                    const sc = document.createElement('button');
                    sc.classList.add('action');
                    sc.innerHTML = `<i class="fa-brands fa-youtube c-red"></i> Youtube`;
                    sc.onclick = () => window.open(`https://www.youtube.com/channel/${s.youtube}`);
                    uLink.append(sc);
                }
                if(s.twitter) {
                    const sc = document.createElement('button');
                    sc.classList.add('action');
                    sc.innerHTML = `<i class="fa-brands fa-twitter c-blue"></i> Twitter`;
                    sc.onclick = () => window.open(`https://twitter.com/${s.twitter}`);
                    uLink.append(sc);
                }
            }
            socialLinks();

            container.appendChild(element);

        },
        init(s, id) {
            container.innerHTML = '';
            this.header();
            this.main(s, id);
        }
    }

    const langCheker = async() => {
        let getLang;
        await fetch('../data/js/language.json').then((data) => data.json()).then((res) => {
            getLang = res;
        });

        let currentLang;
        if(userLocale.state.last_lang == 'indonesia') {
            currentLang = 'indonesia'
        } else {
            currentLang = 'english';
        }
        
        lang = getLang[currentLang].User;
    }

    onAuthStateChanged(auth, (user) =>{
        if(user) {
            langCheker();
            getID(user).then((res) => {
                currentID = res
                getURL();
            });
        } else {
            window.location.href = window.location.origin + '/login/';
        }
    })

})();