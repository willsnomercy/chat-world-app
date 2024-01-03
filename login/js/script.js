import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, GoogleAuthProvider, signInWithRedirect} from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
import { firebaseConfig } from '../../data/js/config.js';

(() => {
    const app = initializeApp(firebaseConfig);
    const auth = getAuth(app);
    userLocale.onData.load();
    
    let lang;

    const container = document.querySelector('.container');

    const loginCard = () => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = (`
            <h1>${lang.login}</h1>
            <div class="group">
                <select name="language" id="changeLang">
                    <option value="">Language</option>
                    <option value="indonesia">Bahasa Indonesia</option>
                    <option value="english">English</option>
                </select>
            </div>
            <br/>
            <div class="group">
                <button class="c-red" id="google-login">
                    <i class="fa-brands fa-google"></i>
                    <p>Google</p>
                </button>
            </div>
        `);

        const changeLang = card.querySelector('#changeLang');
        changeLang.onchange = async() => {
            await userLocale.action.cahngeLang(changeLang.value);
            await langCheker();
            loginCard();
        }

        const google = card.querySelector('#google-login');

        const visibility = (clicked) => {
            let providerAll = [google];
            providerAll.forEach((element) => {
                if(clicked !== element) {
                    element.style.visibility = 'hidden';
                }
            });

            card.querySelector('#changeLang').style.visibility = 'hidden';

            let loading = ['Loading...'];
            loading = loading[Math.floor(Math.random() * loading.length)];

            clicked.querySelector('p').innerHTML = loading;
            card.querySelector('h1').innerHTML = lang.loading;
        }

        google.onclick = () => {
            visibility(google);
            const provider = new GoogleAuthProvider();
            signInWithRedirect(auth, provider);
        }

        container.innerHTML = '';
        container.appendChild(card);
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
        
        lang = getLang[currentLang].Login.Index;
    }
    langCheker();

    onAuthStateChanged(auth, (user) => {
        container.innerHTML = `${lang.preparing}...`;
        if(user) {
            window.location.href = window.location.origin + '/dashboard/';
        } else {
            loginCard();
        }
    })
})();