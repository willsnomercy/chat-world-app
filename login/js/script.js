
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-app.js";
import { getAuth, onAuthStateChanged, getRedirectResult, GoogleAuthProvider, GithubAuthProvider, FacebookAuthProvider, signInWithRedirect, sendSignInLinkToEmail } from "https://www.gstatic.com/firebasejs/9.10.0/firebase-auth.js";
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
                <button class="c-white" id="github-login">
                    <i class="fa-brands fa-github"></i>
                    <p>GitHub</p>
                </button>
                <button class="c-blue" id="facebook-login">
                    <i class="fa-brands fa-facebook-f"></i>
                    <p>Facebook</p>
                </button>
                <button class="c-green" id="email-form">
                    <i class="fa-regular fa-envelope"></i>
                    <p>Email</p>
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
        const github = card.querySelector('#github-login');
        const facebook = card.querySelector('#facebook-login');
        const emailForm = card.querySelector(`#email-form`);

        const visibility = (clicked) => {
            let providerAll = [google, github, facebook, emailForm];
            providerAll.forEach((element) => {
                if(clicked !== element) {
                    element.style.visibility = 'hidden';
                }
            });

            card.querySelector('#changeLang').style.visibility = 'hidden';

            let loading = ['Okay Let\'s Go', 'Wise Choice', 'Wkwkwk', 'Not Bad!', 'Ur good to go!'];
            loading = loading[Math.floor(Math.random() * loading.length)];

            clicked.querySelector('p').innerHTML = loading;
            card.querySelector('h1').innerHTML = lang.loading;
        }

        google.onclick = () => {
            visibility(google);
            const provider = new GoogleAuthProvider();
            signInWithRedirect(auth, provider);
        }
        github.onclick = () => {
            visibility(github);
            const provider = new GithubAuthProvider();
            signInWithRedirect(auth, provider);
        }
        facebook.onclick = () => {
            popup.confirm({
                msg: 'We <b class="c-red">ARE NOT</b> recommending you to login with Facebook since Meta <b class="c-red">DOES NOT</b> care about privacy.<br/>Still want to continue!?',
                onyes: () => {
                    const provider = new FacebookAuthProvider();
                    signInWithRedirect(auth, provider);
                    visibility(facebook);
                }
            })
        }

        emailForm.addEventListener('click', () => transition(card, emailCard));

        container.innerHTML = '';
        container.appendChild(card);
    }
    
    const emailCard = () => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = (`
            <h1>${lang.login}</h1>
            <label for="email">Email:</label>
            <input type="email" name="email" id="email" placeholder="${lang.your_email}.." maxlength="360"/>
            <div class="group-flex">
                <button id="back-to-login" class="c-red">${lang.cancel}</button>
                <button id="email-login" class="c-green">${lang.send}</button>
            </div>
        `);
        
        const loginForm = card.querySelector(`#back-to-login`);
        loginForm.addEventListener('click', () => transition(card, loginCard));

        const input = card.querySelector(`#email`);
        const send = card.querySelector(`#email-login`);
        send.onclick = () => {
            emailHandler(input.value);
            send.innerHTML = `${lang.checking}...`;
            input.style.visibility = 'hidden';
            loginForm.style.visibility = 'hidden';
        };

        const emailHandler = (email) => {
            const actionCodeSettings = {
                url: `${window.location.origin}/login/email-verification.html`,
                handleCodeInApp: true,
            };
            sendSignInLinkToEmail(auth, email, actionCodeSettings)
            .then(() => {
                window.localStorage.setItem('kiriminEmailSignIn', email);
                popup.alert({
                    msg: lang.signin_link,
                    type: "blue",
                    onyes: () => transition(card, almostCard)
                });
            })
            .catch((error) => {
                popup.alert({msg: error, onyes: () => transition(card, emailCard)});
            });
        }

        container.appendChild(card);
        input.focus();
    }

    const almostCard = () => {
        const card = document.createElement('div');
        card.classList.add('card');
        card.innerHTML = (`
            <h1>${lang.almost}!</h1>
            <p><i>${lang.we_sent}</i></p>
            <p class="c-yellow"><i>${lang.do_not_close}</i></p>
        `);

        container.appendChild(card);
    }

    const transition = (prevCard, nextCard) => {
        prevCard.classList.add('deleted');
        setTimeout(() => {
            container.removeChild(prevCard);
            nextCard();
        }, 200);
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
