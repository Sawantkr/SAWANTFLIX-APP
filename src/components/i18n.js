// src/i18n.js
import i18n from "i18next";
import { initReactI18next } from "react-i18next";

i18n.use(initReactI18next).init({
  resources: {
    en: {
      translation: {
        home: "Home",
        tv: "TV Shows",
        movies: "Movies",
        new: "New & Popular",
        myList: "My List",
        signIn: "Sign In",
        signUp: "Sign Up",
        profile: "Profile",
        account: "Account",
        payment: "Payment",
        help: "Help Center",
        logout: "Logout",
        search: "Search..."
      }
    },
    hi: {
      translation: {
        home: "होम",
        tv: "टीवी शो",
        movies: "फ़िल्में",
        new: "नया और लोकप्रिय",
        myList: "मेरी सूची",
        signIn: "साइन इन",
        signUp: "साइन अप",
        profile: "प्रोफ़ाइल",
        account: "खाता",
        payment: "भुगतान",
        help: "सहायता केंद्र",
        logout: "लॉगआउट",
        search: "खोजें..."
      }
    }
  },
  lng: "en", // default
  fallbackLng: "en",
  interpolation: { escapeValue: false }
});

export default i18n;
