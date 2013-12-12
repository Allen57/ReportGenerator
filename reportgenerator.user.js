// ==UserScript==
// @name       ReportGenerator
// @version    0.5
// @description  Script qui permet de générer un rapport du vaisseau en cours
// @match      http://mush.vg/*
// @copyright  2012+, You
// @namespace https://github.com/Allen57/ReportGenerator
// @updateurl https://github.com/Allen57/ReportGenerator/raw/master/reportgenerator.user.js
// ==/UserScript==
// @require http://code.jquery.com/jquery-latest.js
var $ = unsafeWindow.jQuery;
var Main = unsafeWindow.Main;
var now, cycle, jour, projets, nbProjets, recherches, nbRecherches, oxy, fuel, armure, bouclier, calculInfo = false,
    nbVivants, vivants, morts, tabActive, change = false;

//Liste ordonnée des noms des personnages
var heros = ["Chao", "Chun", "Eleesha", "Finola", "Frieda", "Gioele", "Hua", "Ian", "Janice", "Jin Su", "Kuan Ti", "Paola", "Raluca", "Roland", "Stephen", "Terrence"];

//Valeurs par défaut des différents paramètres utilisées
var defaultValue = {rg_nom: 'Nom Inconnu', rg_bdd: '??', rg_bases: '??', rg_maj: '??', rg_expeditions: '??', rg_artefacts: '??', rg_cartes: '??', rg_pilgred: '??', rg_plantes: '??'};

function RgTabTip(e) {
    var tgt = (e || event).target;
    var title = "ReportGenerator";
    var desc = "Générateur de rapport de vaisseau pour le forum.";
    Main.showTip(tgt,
        "<div class='tiptop' ><div class='tipbottom'><div class='tipbg'><div class='tipcontent'>" +
            (title ? "<h1>" + title + "</h1>" : "") +
            (desc ? "<p>" + desc.replace("\r\n", "") + "</p>" : "") +
            "</div></div></div></div>"
    );
}

function SelectTab(el) {
    tabActive = false;
    var $rgtab = $("#rg_tab");
    var $rgtabcontent = $("#rg_tab_content");
    if (el.getAttribute('data-tab') != '13') {
        $rgtab.removeClass("tabon").addClass("taboff");
        $rgtabcontent.css("display", "none");
        if (el.getAttribute('data-tab') != undefined) {
            Main.selChat(el.getAttribute('data-tab'));
        }
        return;
    }

    // Select tab
    $("#cdTabsChat").find("li").removeClass("tabon").addClass("taboff");
    $rgtab.removeClass("taboff").addClass("tabon");

    // Display content
    $("#localChannel").css("display", "none");
    $("#mushChannel").css("display", "none");
    $(".objective").css("display", "none");
    $("#cdStdWall").css("display", "none");
    $("#cdFavWall").css("display", "none");
    for (var i = 0; i < 3; i++)
        $("#cdPrivate" + i).css("display", "none");
    $("#privateform").css("display", "none");
    $("#wall").css("display", "none");
    $("#astrotab_content").css("display", "none");
    $rgtabcontent.css("display", "block");
    tabActive = true;
    fillRapport();
}

function buildTab() {
    var $rgtab = $("#rg_tab");
    if ($rgtab.length > 0) return;
    var rbg = $("#chatBlock");
    $("<div>").addClass("cdTab").attr("id", "rg_tab_content").appendTo(rbg);
    $rgtab.attr("_title", "ReportGenerator").attr("_desc", "Permet de générer un rapport.");

    var $tabschat = $("#cdTabsChat");
    var tabs = $("<li>").addClass("tab taboff").attr("id", "rg_tab").attr("data-tab", "13").appendTo($tabschat);
    $("<img>").attr("src", "/img/icons/ui/book.png").appendTo(tabs);
    fill_tab();

    $rgtab = $("#rg_tab");
    var $rgtabcontent = $("#rg_tab_content");
    $rgtabcontent.css("display", "none");
    $rgtabcontent.parent().css('height', '500px');
    $rgtab.on("mouseover", RgTabTip);
    $rgtab.on("mouseout", Main.hideTip);
    $tabschat.find("li").on("click", function () {
        SelectTab(this);
    });
}

function calculerInfos() {
    calculInfo = true;
    cycle = Main.curCycle();
    jour = 1 + Math.floor(cycle / 8);
    cycle = cycle % 8 + 1;

    var data = [];
    $(".spaceshipstatus ul li").each(function (i) {
        if (i > 2) {
            return;
        }
        data[i] = $(this).text().trim();
    });
    oxy = data[0];
    fuel = data[1];
    armure = data[2];

    var infoBouclier = $(".spaceshipstatus ul li:eq(2)").attr("onmouseover");
    var pattern = /Bouclier plasma : (\d*)/g;
    var res = pattern.exec(infoBouclier);
    if (res) {
        bouclier = res[1];
    } else {
        bouclier = false;
    }

    projets = "";
    nbProjets = 0;
    var $cdBottomBlock = $("#cdBottomBlock");
    $cdBottomBlock.find("ul li:has(div.project) img").each(function () {
        var pattern = /<h1>(.*?)<\/h1>/g;
        var res = pattern.exec($(this).attr("onMouseOver"));
        if (projets.length != 0) {
            projets += ", ";
        }
        projets += res[1].stripSlashes();
        nbProjets++;
    });

    recherches = "";
    nbRecherches = 0;
    $cdBottomBlock.find("ul li:has(div.research) img").each(function () {
        var pattern = /<h1>(.*?)<\/h1>/g;
        var res = pattern.exec($(this).attr("onMouseOver"));
        if (recherches.length != 0) {
            recherches += ", ";
        }
        recherches += res[1].stripSlashes();
        nbRecherches++;
    });
}
function genererRapport() {
    if (!calculInfo) {
        calculerInfos();
    }

    var aliveHeroes = [];
    nbVivants = 0;
    heros.forEach(function (hero) {
        if (localStorage['rg_' + hero + "_etat"] == "vivant") {
            aliveHeroes.push(hero);
            nbVivants++;
        }
    });
    vivants = aliveHeroes.join(", ");
    morts = heros.diff(aliveHeroes).join(", ");

    var content = "";
    content += "**" + localStorage['rg_nom'] + "**" + "\n" +
        "**//J" + jour + "-C" + cycle + "//**" + "\n" +
        "\n" +
        ":mush_hp: **" + nbVivants + " Personnes en vie :** " + vivants + "\n" +
        ":mush_dead: **" + (16 - nbVivants) + " Morts :** " + morts + "\n" +
        "\n" +
        ":mush_pa_comp: **" + nbProjets + " Projets :** " + projets + "\n" +
        ":mush_pills: **" + nbRecherches + " Recherches :** " + recherches + "\n" +
        "\n" +
        "**//:mush_talky: Communications ://**" + "\n" +
        "\n" +
        "**Xyloph BDD :** " + localStorage['rg_bdd'] + "\n" +
        "**Bases rebelles :** " + localStorage['rg_bases'] + "\n" +
        ":mush_pa_core: **Maj Neron :** " + localStorage['rg_maj'] + "\n" +
        "\n" +
        ":mush_explorer_1: **Expéditions :** " + localStorage['rg_expeditions'] + "\n" +
        ":mush_explo_feed_1: **Artéfacts :** " + localStorage['rg_artefacts'] + "\n" +
        "**Morceaux de carte stellaire :** " + localStorage['rg_cartes'] + "\n" +
        "\n" +
        ":mush_o2: **Oxygène :** " + oxy + "\n" +
        ":mush_fuel: **Fuel :** " + fuel + "\n" +
        "**Armure :** " + armure + "\n" +
        (bouclier ? "**Bouclier plasma :** " + bouclier + "\n" : "") +
        "\n" +
        ":mush_pa_pilgred: **Pilgred :** " + localStorage['rg_pilgred'] + "\n" +
        "\n" +
        ":mush_pa_garden: **Plantes :** " + localStorage['rg_plantes'];
    return content;
}
function fillRapport() {
    var rapport = genererRapport();
    $("#rg_rapport").html(rapport);
}
function getForm(label, nom) {
    return "<label for='" + nom + "'>" + label + " : </label> <input type='text' name='" + nom + "' id='" + nom + "' value='" + localStorage[nom] + "' style='color: black'/><br>";
}

function fill_tab() {
    var tab = $("#rg_tab_content").empty();
    var titre = "<div class='objtitle'>ReportGenerator</div><br>";
    var options = "<div class='replybuttons'><a id='rg_reset' class='butmini'>Réinitialiser</a></div><br>";
    var rapport = "<textarea style='color: black; height: 100px; width: 350px;' id='rg_rapport'></textarea><br>";
    var forms = "<form action='#'>";
    forms += getForm("Nom du vaisseau", "rg_nom");
    forms += getForm("BDD Xyloph", "rg_bdd");
    forms += getForm("Bases rebelles", "rg_bases");
    forms += getForm("Maj NERON", "rg_maj");
    forms += getForm("Expéditions", "rg_expeditions");
    forms += getForm("Artefacts", "rg_artefacts");
    forms += getForm("Morceaux de carte stellaire", "rg_cartes");
    forms += getForm("Pilgred", "rg_pilgred");
    forms += getForm("Plantes", "rg_plantes");

    forms += "<select id='rg_hero' style='color: black'>";
    heros.forEach(function (hero) {
        forms += "<option value='" + hero + "'>" + hero + "</option>";
    });
    forms += "</select>";
    forms += "<span id='rg_hero_info'/><br>";
    forms += "</form>";

    $("<div>").html(titre + options + rapport + forms).css("text-align", "center").appendTo(tab);

    $("#rg_hero").bind("change",function () {
        fillHeroInfo(this.value);
    }).change();

    $("#rg_reset").click(function () {
        if (confirm("Voulez-vous vraiment réinitialiser l'ensemble des données saisies ?")) {
            console.log("Reset !");
            reset();
        }
    });
}

function fillHeroInfo(hero) {
    var $rgheroinfo = $("#rg_hero_info");
//    $rgheroinfo.empty();
    var infos = " - <label>Etat :</label>";
    infos += "<select id='rg_hero_etat' style='color: black'>>";
    var options = {vivant: "vivant(e)", mort: "mort(e)"};
    for (var key in options) {
        if (options.hasOwnProperty(key)) {
            var selected = localStorage['rg_' + hero + '_etat'] == key ? 'selected' : '';
            infos += "<option value='" + key + "' " + selected + ">" + options[key] + "</option>";
        }
    }
    infos += "</select><br><span id='rg_hero_info_etat'/>";
    $rgheroinfo.html(infos);
    $("#rg_hero_etat").bind("change",function () {
        //Pour modifier le rapport en consequence
        change = true;

        var $rgheroinfoetat = $("#rg_hero_info_etat");
        switch (this.value) {
            case "vivant":
                localStorage['rg_' + hero + "_etat"] = "vivant";
                $rgheroinfoetat.empty();
                break;
            case "mort":
                localStorage['rg_' + hero + "_etat"] = "mort";
                $rgheroinfoetat.html("Implémentation des causes de décès à venir ...");
        }
    }).change();
}

function checkChangeNom(nom) {
    var val = $("#" + nom).val();
    if (val != localStorage[nom]) {
        localStorage[nom] = val;
        return true;
    }
    return false;
}

function checkChange() {
    for (var key in defaultValue) {
        if (defaultValue.hasOwnProperty(key)) {
            if (checkChangeNom(key)) {
                change = true;
            }
        }
    }
    if (change) {
        checkDefault();
        fillRapport();
        change = false;
    }
}
function setDefault(nom, val) {
    if (!localStorage[nom] || localStorage[nom] == "" || localStorage[nom] == "undefined") {
        localStorage[nom] = val;
    }

}

function checkDefault() {
    for (var key in defaultValue) {
        if (defaultValue.hasOwnProperty(key)) {
            setDefault(key, defaultValue[key]);
        }
    }

    //initialise les attributs pour chaque hero
    heros.forEach(function (hero) {
        if (!localStorage['rg_' + hero + "_etat"]) {
            localStorage['rg_' + hero + "_etat"] = "vivant";
        }
    })
}

function setFormValue(key, value) {
    $('#' + key).val(value);
}

function reset() {
    for (var key in defaultValue) {
        if (defaultValue.hasOwnProperty(key)) {
            localStorage[key] = defaultValue[key];
            setFormValue(key, defaultValue[key]);
        }
    }

    //initialise les attributs pour chaque hero
    heros.forEach(function (hero) {
        localStorage['rg_' + hero + "_etat"] = "vivant";
    });

    change = true;
}

function startScript() {
    var $input = $("#input");
    if ($input.length == 0) {
        return;
    }
    console.log('Debut');

    now = $input.attr('now');
    checkDefault();
    tabActive = false;
    setInterval(function () {
        if (!tabActive) {
            buildTab();
            return;
        }
        var gameNow = $("#input").attr('now');
        if (gameNow != now) {
            now = gameNow;
        }
        checkDefault();
        buildTab();
        checkChange();
    }, 1000);
}

window.addEventListener('load', startScript, false);


String.prototype.stripSlashes = function () {
    return this.replace(/\\(.?)/g, function (s, n1) {
        switch (n1) {
            case '\\':
                return '\\';
            case '0':
                return '\u0000';
            case '':
                return '';
            default:
                return n1;
        }
    });
};

Array.prototype.diff = function (a) {
    return this.filter(function (i) {
        return !(a.indexOf(i) > -1);
    });
};

