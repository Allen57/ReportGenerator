// ==UserScript==
// @name       ReportGenerator
// @version    0.4
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
    nbVivants, vivants, morts, tabActive;

heros = ['Jin Su', 'Frieda', 'Kuan Ti', 'Janice', 'Roland', 'Hua', 'Paola', 'Chao', 'Finola', 'Stephen', 'Ian', 'Chun', 'Raluca', 'Gioele', 'Eleesha', 'Terrence'];


function TabTip(e) {
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
    var $rgtabcontent = $("#rg_tab_content");
    $rgtabcontent.css("display", "none");
    $rgtabcontent.parent().css('height', '500px');
    $rgtab.on("mouseover", TabTip);
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
    var $it = Main.heroes.iterator();
    var aliveHeroes = [];
    nbVivants = 0;
    while ($it.hasNext()) {
        var hero = $it.next();
        aliveHeroes.push(hero.surname);
        nbVivants++;
    }
    vivants = aliveHeroes.join(", ");
    morts = heros.diff(aliveHeroes).join(", ");
}
function genererRapport() {
    if (!calculInfo) {
        calculerInfos();
    }
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
    var titre = "<h2>Rapport</h2><br>";
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
    forms += "</form>";
    $("<div>").html(titre + rapport + forms).css("text-align", "center").appendTo(tab);
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
    var change = false;
    if (checkChangeNom('rg_nom')) {
        change = true;
    }
    if (checkChangeNom('rg_bdd')) {
        change = true;
    }
    if (checkChangeNom('rg_bases')) {
        change = true;
    }
    if (checkChangeNom('rg_maj')) {
        change = true;
    }
    if (checkChangeNom('rg_expeditions')) {
        change = true;
    }
    if (checkChangeNom('rg_artefacts')) {
        change = true;
    }
    if (checkChangeNom('rg_cartes')) {
        change = true;
    }
    if (checkChangeNom('rg_pilgred')) {
        change = true;
    }
    if (checkChangeNom('rg_plantes')) {
        change = true;
    }
    if (change) {
        checkDefault();
        fillRapport();
    }
}
function setDefault(nom, val) {
    if (!localStorage[nom] || localStorage[nom] == "" || localStorage[nom] == "undefined") {
        localStorage[nom] = val;
    }

}
function checkDefault() {
    setDefault('rg_nom', 'Nom Inconnu');
    setDefault('rg_bdd', '??');
    setDefault('rg_bases', '??');
    setDefault('rg_maj', '??');
    setDefault('rg_expeditions', '??');
    setDefault('rg_artefacts', '??');
    setDefault('rg_cartes', '??');
    setDefault('rg_pilgred', '??');
    setDefault('rg_plantes', '??');
}
function startScript() {
    var $input = $("#input");
    if ($input.length == 0) {
        return;
    }
    console.log('Debut');

    now = $input.attr('now');
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

