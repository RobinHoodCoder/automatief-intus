// import "@babel/polyfill";
// Polyfills voor babel (zodat het werkt in IE 11)
($(function() {


    const tableHeaderDom = document.querySelector('.table-header');
    const headerCols = tableHeaderDom.querySelectorAll('.col');
    const tableBodyDOM = document.querySelector('.table-body');
    const resultInformationDOM = document.querySelector('.result-information');


    /*
    * TODO: Tabular gebruiken
    * */

    /*TODO: json imports via webpack werkend krijgen..
    * */
    // const werknemersJson = {
    //     "werknemers": {
    //         "993": {
    //             "name": "Gerard van Halst",
    //             "id": "993",
    //             "job_function": "Medewerker",
    //             "starting_date": "12-09-2005",
    //             "status": "aanwezig",
    //             "notes": "...",
    //             "salary":  "2.301,34"
    //         },
    //         "994": {
    //             "name": "Berendt van Halst",
    //             "id": "994",
    //             "job_function": "Medewerker",
    //             "starting_date": "12-09-2005",
    //             "status": "aanwezig",
    //             "notes": "...",
    //             "salary":  "4.301,34"
    //         },
    //         "995": {
    //             "name": "Truus van der Apel",
    //             "id": "995",
    //             "job_function": "Medewerker",
    //             "starting_date": "01-09-1999",
    //             "status": "aanwezig",
    //             "notes": "...",
    //             "salary":  "4.301,34"
    //         },
    //         "996": {
    //             "name": "Loes van Keepbergen",
    //             "id": "996",
    //             "job_function": "Medewerker",
    //             "starting_date": "12-09-2005",
    //             "status": "afwezig",
    //             "notes": "...",
    //             "salary":  "4.301,34"
    //         },
    //         "123": {
    //             "name": "Peter de Vries - Broekhoven",
    //             "id": "123",
    //             "job_function": "Monteur",
    //             "starting_date": "28-11-1994",
    //             "status": "afwezig",
    //             "notes": "...",
    //             "salary":  "3.010,10"
    //         }
    //     }
    // }
    // let jsonData = Object.entries(werknemersJson.werknemers);
    // setTimeout(function () {
    //     var table = new Tabulator(".table", {
    //         height:311,
    //         layout:"fitColumns",
    //         autoColumns:true,
    //         placeholder:"No Data Available", //display message to user on empty table
    //     });
    //     table.setData(jsonData);
    // },1000)




    // sorteer de resultaten met deze functie
    function sortResults(prop, data, asc) {
        data.sort(function(a, b) {
            if (asc) {
                return (a[prop] > b[prop]) ? 1 : ((a[prop] < b[prop]) ? -1 : 0);
            } else {
                return (b[prop] > a[prop]) ? 1 : ((b[prop] < a[prop]) ? -1 : 0);
            }
        });
    }
    // Maak kolommen DOM
    function rowheaderColsRender(description, item) {
        if (description == 'status') {
            return `<div class="col ${description}"><span class="status ${item}">${item}</span></div>`;
        }else{
            return `<div class="col ${description}">${item}</div>`;
        }
    }
    function createResultInformation(items){
        return `.. t/m .. van ${items.length} resultaten`;
    }

    //Haal werknemers op uit json...
    $.getJSON( "./ajax/werknemers.json", function( data ) {

        const createSortedTable = function(sortBy,asc) {
            //Maak tabel eerst leeg...
            tableBodyDOM.innerHTML = '';
            $.each(data, function (key, val) {
                //Werknemers object
                let sortableArray = Object.values(val);
                // Sorteer resultaten op basis van de imput van deze functie..
                sortResults(sortBy, sortableArray, asc);
                const sortedData = sortableArray;


                let amount = createResultInformation(sortedData);
                resultInformationDOM.innerHTML = amount;

                $.each(sortedData, function (key, data) {

                    let renderheaderCols = [];
                    //Zet alle kolommen met werknemergegevens bij elkaar
                    $.each(data, function (key, colContent) {
                        renderheaderCols.push(rowheaderColsRender(key, colContent));
                    });

                    //checkbox moet aan elke eerste kolom worden toegevoegd...
                    let checkboxDOM = `<div class="col"><span class="checkbox"></span></div>`;
                    //Zet de checkbox aan het begin van de array met te renderen elementen
                    renderheaderCols.unshift(checkboxDOM);

                    //Maak nieuwe rij voor de tabel met werknemers
                    let newRow = document.createElement('div');
                    newRow.className += 'row';

                    //Zet de colommen (gegevens van medewerkers) in de rijen...
                    newRow.innerHTML = renderheaderCols.join("");

                    //Zet de nieuwe elementen in de table body
                    tableBodyDOM.appendChild(newRow);

                });
            });
        }



        //Vul de tabel met data als pagina wordt ingeladen..
        createSortedTable('name','asc');

        //Sorteer resultaten in tabel door op elementen te klikken...
        for (var i = 0; i < headerCols.length; i++) {
            var sortItem = headerCols[i];
            let action = sortItem.getAttribute("data-sort");

            if(action){
                sortItem.addEventListener('click', function() {
                    //Maak alle sorteer buttons inactief, behalve degene die is aangeklikt...
                    $(this).toggleClass('active');
                    $(this).siblings().removeClass('active');

                    if (this.classList.contains('active')){
                        //Maak resultaten afllopend bij 2e kleer klikken...
                        createSortedTable(action,false);
                    }else{
                        //Maak resultaten oplopend bij 1e kleer klikken...
                        createSortedTable(action,true);
                    }
                })
            }
        }


    });

}));




