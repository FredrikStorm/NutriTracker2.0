// Når dokumentet er indlæst henter den automatisk alle de meals man har spist og connecter vores knapper til vores functions
document.addEventListener('DOMContentLoaded', () => {

    const addButton = document.querySelector('.knapp');
    addButton.addEventListener('click', openRecipeSelector);

    
    const addIngredientButton = document.querySelector('.button');
    addIngredientButton.addEventListener('click', openIngredientPopup);

  
    const waterButton = document.querySelector('.vann'); 
    waterButton.addEventListener('click', logWaterIntake);

    // Indlæser måltider fra databasen
    loadMeals();
});

// Funktion til at logge vandindtag for en bruger
function logWaterIntake() {
    // Henter brugerens ID fra local storage
    const userID = parseInt(localStorage.getItem('userID'), 10);
    // Udfører en POST-anmodning for at registrere vandindtag
    fetch('http://localhost:3000/tracker/user/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userID })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to log water intake');
        return response.json();
    })
    .then(data => {
        alert("One glass of 250ml water added");
    })
    .catch(error => {
        alert("Failed to log water intake: " + error.message);
    });
}

// Funktion til at åbne en popup for tilføjelse af ingredienser
function openIngredientPopup() {
    const popup = document.createElement('div');
    popup.className = 'popup';
    popup.innerHTML = `
        <div class="search-container">
            <input type="text" id="recipeNameField" placeholder="Enter ingredient name for recipe">
            <input type="text" id="ingredientSearchField" placeholder="Search for ingredients">
            <button onclick="searchIngredient()">Search</button>
        </div>
        <div class="ingredient-list"></div>
        <button onclick="closePopup()">Close</button>
    `;
    document.body.appendChild(popup);
}

// Funktion til at søge efter ingredienser via et API
function searchIngredient() {
    const searchString = document.getElementById('ingredientSearchField').value;
    fetch(`http://localhost:3000/tracker/foodbank/food?search=${encodeURIComponent(searchString)}`)
        .then(response => response.json())
        .then(ingredients => displayIngredients(ingredients))
        .catch(error => console.error('Failed to fetch ingredients:', error));
}

// Funktion til at vise ingredienser i popuppen
function displayIngredients(ingredients) {
    const listContainer = document.querySelector('.ingredient-list');
    listContainer.innerHTML = ''; // Rydder tidligere resultater
    ingredients.forEach(ingredient => {
        const listItem = document.createElement('div');
        listItem.textContent = ingredient.FoodName;
        listItem.onclick = () => addIngredientAsMeal(ingredient);
        listContainer.appendChild(listItem);
    });
}

// Funktion til at tilføje en ingrediens som et måltid
function addIngredientAsMeal(ingredient) {
    const amount = prompt("Enter the amount in grams for " + ingredient.FoodName);
    if (!amount || isNaN(amount)) return;

    const recipeName = document.getElementById('recipeNameField').value.trim();
    if (!recipeName) {
        alert("Please enter a recipe name.");
        return;
    }

    fetchNutritionInfo(ingredient.FoodID, amount)
        .then(nutrients => createRecipe(recipeName, nutrients, amount))
        .then(recipeID => {
            // Sikrer at recipeID er gyldigt før den fortsætter
            if (!recipeID) {
                throw new Error('Recipe ID was not retrieved successfully.');
            }
            const date = new Date().toISOString().split('T')[0];
            const time = getCurrentFormattedTime();  // Sikrer at det aktuelle tidspunkt hentes
            if (navigator.geolocation) {
                navigator.geolocation.getCurrentPosition(function(position) {
                    const latitude = position.coords.latitude.toFixed(6);
                    const longitude = position.coords.longitude.toFixed(6);
                    const location = `${latitude},${longitude}`;
                    postMeal(date, time, location, amount, recipeID);
                }, function(error) {
                    console.error('Error getting location:', error.message);
                    postMeal(date, time, "0.0,0.0", amount, recipeID);
                });
            } else {
                console.error('Geolocation is not supported by this browser.');
                postMeal(date, time, "0.0,0.0", amount, recipeID);
            }
        })
        .catch(error => {
            console.error('Error in processing ingredient:', error);
            alert('Failed to process ingredient: ' + error.message);
        });
}

// Funktion til at behandle en ingrediens, oprette en opskrift og logge et måltid
function processIngredient(ingredient, amount, recipeName, date, time, location) {
    // Først hentes ernæringsinformation baseret på ingrediensens ID og mængde, og et opskriftsnavn
    fetchNutritionInfo(ingredient.FoodID, amount, recipeName)
        .then(nutrients => {
            // Når ernæringsinformationen er hentet, oprettes en opskrift
            return createRecipe(recipeName, nutrients, amount);
        })
        .then(recipeID => {
            // Når opskriften er oprettet, og vi har et recipeID, logges måltidet
            postMeal(date, time, location, amount, recipeID);
        })
        .catch(error => {
            // Hvis der opstår en fejl i nogen del af processen, logges denne i konsollen
            console.error('Feil i behandling av ingrediens:', error);
        });
}

// Funktion til at hente ernæringsoplysninger baseret på fødevare-ID og mængde
function fetchNutritionInfo(foodID, amount, recipeName) {
    // Definerer en liste med ID'er for de ønskede ernæringsdata
    const nutrientIDs = {
        calories: 356,
        fiber: 168,
        protein: 218,
        fat: 141
    };

    // Opretter URLs for at hente data for hver værdi
    const urls = Object.keys(nutrientIDs).map(key => `http://localhost:3000/tracker/foodbank/foodParameter?foodID=${foodID}&parameterID=${nutrientIDs[key]}`);

    // Anvender Promise.all for at håndtere flere asynkrone fetch-kald 
    return Promise.all(urls.map(url => fetch(url).then(res => res.json())))
        .then(results => {
            // Beregner ernæringsværdier baseret på mængden
            const nutrients = {
                calories: ((results[0].ResVal / 100) * amount),
                fiber: ((results[1].ResVal / 100) * amount),
                protein: ((results[2].ResVal / 100) * amount),
                fat: ((results[3].ResVal / 100) * amount)
            };
            return nutrients;
        });
}

// Funktion til at oprette en opskrift i databasen
function createRecipe(foodName, nutrients, amount) {
    // Henter brugerens ID fra lokal lagring
    const userID = parseInt(localStorage.getItem('userID'), 10);
    // Sender en POST-anmodning til serveren med opskriftsdata
    return fetch('http://localhost:3000/tracker/user/recipe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            recipeName: foodName,
            userID: userID,
            protein: nutrients.protein.toFixed(2),
            kcal: nutrients.calories.toFixed(2),
            fat: nutrients.fat.toFixed(2),
            fiber: nutrients.fiber.toFixed(2)
        })
    }).then(response => response.json())
      .then(data => {
          if (!data || !data.recipeID) {
              throw new Error('Failed to save recipe or retrieve recipe ID');
          }
          return data.recipeID; // Returnerer recipeID
      });
}



// Funktion til at lukke en popup
function closePopup() {
    // Finder popup-elementet i dokumentet
    const popup = document.querySelector('.popup');
    // Fjerner popuppen fra dokumentet, hvis den findes
    if (popup) document.body.removeChild(popup);
}

// Funktionen åbner en vælger for opskrifter baseret på brugerens ID
function openRecipeSelector() {
    // Henter brugerens ID fra lokal lagring
    const userID = parseInt(localStorage.getItem('userID'), 10);
    // Anmoder om brugerens opskrifter fra serveren
    fetch(`http://localhost:3000/tracker/user/recipe?userID=${userID}`)
        .then(response => {
            // Kontrollerer, om anmodningen lykkedes
            if (!response.ok) throw new Error('Failed to fetch');
            return response.json(); // Konverterer svaret til JSON
        })
        .then(recipes => createRecipePopup(recipes)) // Opretter en popup med de hentede opskrifter
        .catch(error => console.error('Failed to fetch recipes:', error)); // Logger eventuelle fejl
}


// Funktionen opretter en popup til at vælge en opskrift
function createRecipePopup(recipes) {
    const popup = document.createElement('div');
    popup.className = 'popup'; // Sætter klassenavn for styling og tilgang

    const formContainer = document.createElement('div');
    formContainer.className = 'form-container'; 

    const select = document.createElement('select');
    select.id = 'recipeSelect'; // Opretter et dropdown-menu
    const defaultOption = document.createElement('option');
    defaultOption.textContent = 'Choose meal'; 
    defaultOption.disabled = true;
    defaultOption.selected = true;
    select.appendChild(defaultOption);

    // Tilføjer hver opskrift som en valgmulighed i dropdown-menuen
    recipes.forEach(recipe => {
        const option = document.createElement('option');
        option.value = recipe.recipeID; // Sætter opskriftens ID som værdi
        option.textContent = recipe.recipeName; // Viser opskriftens navn
        select.appendChild(option);
    });

    const weightInput = document.createElement('input');
    weightInput.placeholder = 'Weight in grams'; // Inputfelt til at angive vægten af måltidet
    weightInput.type = 'number';
    weightInput.id = 'weightInput';

    // Tilføjer elementer til formContainer
    formContainer.appendChild(select);
    formContainer.appendChild(weightInput);

    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close'; // Knap til at lukke popup
    closeButton.onclick = () => document.body.removeChild(popup); // Fjerner popup fra DOM

    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Confirm'; // Bekræftelsesknap
    confirmButton.onclick = confirmRegistration; // Funktion til at bekræfte valget 

    // Tilføjer formular og knapper til popup og tilføjer popup til dokumentet
    popup.appendChild(formContainer);
    popup.appendChild(confirmButton);
    popup.appendChild(closeButton);
    document.body.appendChild(popup);
}

// Funktionen returnerer den aktuelle tid formateret i HH:mm:ss baseret på brugerens tidssone
function getCurrentFormattedTime() {
    const now = new Date();
    now.setHours(now.getHours() + 2);  // Justerer med 2 timer for at kompensere for tidssoneforskelle
    const time = now.toISOString().split('T')[1].slice(0, 8); // Splitter ISO strengen for at få tid og formatterer til HH:mm:ss
    return time;
}

// Funktionen bekræfter valget af en opskrift og registrerer et måltid baseret på brugerens valg og geografiske placering.
function confirmRegistration() {
    // Henter valgte opskrifts-ID og vægt fra brugerens input.
    const selectedRecipeId = document.getElementById('recipeSelect').value;
    const weight = parseFloat(document.getElementById('weightInput').value);
    const date = new Date().toISOString().split('T')[0]; // Udtrækker datoen
    const time = getCurrentFormattedTime(); // Henter korrekt tid med den rigtige tidszone 

    // Tjekker om browseren understøtter geolokation
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(function(position) {
            // Success callback: Henter og formaterer geografisk bredde og længde
            const latitude = position.coords.latitude.toFixed(6);
            const longitude = position.coords.longitude.toFixed(6);
            const location = latitude + ',' + longitude; 

            // Med lokationsinformation, send anmodning om at registrere måltidet
            postMeal(date, time, location, weight, selectedRecipeId);
        }, function(error) {
            // Error callback: Logger fejlen og forsøger at registrere uden specifik lokation
            console.error('Error getting location:', error.message);
            postMeal(date, time, 'unknown location', weight, selectedRecipeId); // Bruger 'unknown location' som standard
        });
    } else {
        // Hvis geolokation ikke understøttes, logges fejlen og måltidet registreres med standardlokation
        console.error('Geolocation is not supported by this browser.');
        postMeal(date, time, 'unknown location', weight, selectedRecipeId); // Bruger 'unknown location' som standard
    }
}

function postMeal(date, time, location, weight, recipeId) {
    const userID = parseInt(localStorage.getItem('userID'), 10);
    fetch('http://localhost:3000/tracker/user/meal', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            date: date,
            time: time,
            location: location,
            weight: weight,
            userID: userID, // bruger det userID som der er logget ind med
            recipeID: recipeId
        })
    })
    .then(response => {
        if (!response.ok) throw new Error('Failed to save meal');
        return response.json();
    })
    .then(data => {
        console.log('Meal registered:', data);
        mealID = data.mealID // lagrer mealID fra responsen
        document.body.removeChild(document.querySelector('.popup')); // fjerner popup menuen
        return fetch(`http://localhost:3000/tracker/user/recipe/${recipeId}`); // henter recipe detaljerne
    })
    .then(response => response.json())
    .then(recipe => {
        addToMealList(recipe.recipeName, weight, {
            kcal: (recipe.kcal / 100 * weight).toFixed(2),
            protein: (recipe.protein / 100 * weight).toFixed(2),
            fat: (recipe.fat / 100 * weight).toFixed(2),
            fiber: (recipe.fiber / 100 * weight).toFixed(2)
        }, `${date} ${time}`, location, mealID, recipeId ); // tilføjer måltider til listen
        console.log(recipeId); 
    })
    .catch(error => {
        console.error('Error registering meal:', error);
        alert('Failed to register meal: ' + error.message);
    });
}


// Funktion til at indlæse alle måltider tilknyttet en specifik bruger og vise dem i brugergrænsefladen.
function loadMeals() {
    const userID = parseInt(localStorage.getItem('userID'), 10);  // Henter brugerens ID fra lokal lagring
    
    // Anmoder serveren om alle måltider for den angivne bruger
    fetch(`http://localhost:3000/tracker/user/meal?userID=${userID}`)
        .then(response => response.json())  // Parser svaret som JSON
        .then(meals => {
            // Behandler hvert måltid i svaret
            meals.forEach(meal => {
                // Henter opskriftsID, vægt og måltidets ID fra måltidsdata
                const { recipeID, weight, mealID } = meal;
                
                // Anmoder om detaljeret opskriftsinformation baseret på opskriftsID
                fetch(`http://localhost:3000/tracker/user/recipe/${recipeID}`)
                    .then(response => response.json())
                    .then(recipe => {
                        // Formatterer datoen og tiden for måltidet for visning
                        const formattedDate = meal.date.split('T')[0];  // Konverterer ISO streng til YYYY-MM-DD
                        const formattedTime = meal.time.slice(0, -1);  // Fjerner 'Z' fra tidsstempel
                        const location = meal.location;  // Stedet for måltidet
                        
                        // Tilføjer måltidsdata til brugergrænsefladen
                        addToMealList(recipe.recipeName, weight, {
                            kcal: (recipe.kcal / 100 * weight).toFixed(2),
                            protein: (recipe.protein / 100 * weight).toFixed(2),
                            fat: (recipe.fat / 100 * weight).toFixed(2),
                            fiber: (recipe.fiber / 100 * weight).toFixed(2)
                        }, `${formattedDate} ${formattedTime}`, location, mealID, recipeID);
                    })
                    .catch(error => console.error('Failed to fetch recipe details:', error));  // Logger fejl ved hentning af opskriftsdetaljer
            });
        })
        .catch(error => console.error('Failed to load meals:', error));  // Logger fejl hvis hentning af måltider mislykkes
}
// Funktion til at tilføje et måltid til tabellen i brugergrænsefladen
function addToMealList(recipeName, weight, nutrition, dateTime, location, mealID, recipeID) {
    // Finder tabellegemet hvor måltiderne skal indsættes
    const tableBody = document.querySelector('.meal-tracker-table tbody');
    
    // Opretter en ny tabelrække
    const row = document.createElement('tr');
    // Tilføjer data-attributter til rækken for lagring af mealID og recipeID
    row.setAttribute('data-meal-id', mealID);
    row.setAttribute('data-recipe-id', recipeID);
    
    // Indsætter måltidsinformation i rækken som HTML
    row.innerHTML = `
        <td>${recipeName}</td>
        <td>${weight}g</td>
        <td>${nutrition.kcal} kcal</td>
        <td>${nutrition.protein} g</td>
        <td>${nutrition.fat} g</td>
        <td>${nutrition.fiber} g</td>
        <td>${dateTime}</td>
        <td>${location}</td>
        <td>
            <button onclick="editMeal(this)">Edit</button>
            <button onclick="deleteMeal(this)">Delete</button>
        </td>
    `;
    
    // Tilføjer den nye række til tabellen
    tableBody.appendChild(row);
}

// Funktion til at redigere vægten af et måltid og opdatere den tilhørende information i tabellen
function editMeal(element) {
    // Finder den nærmeste tabelrække til elementet, som repræsenterer det pågældende måltid
    const row = element.closest('tr');
    // Henter måltidets ID og opskriftens ID fra data-attributter på rækken
    const mealID = row.getAttribute('data-meal-id');
    const recipeID = row.getAttribute('data-recipe-id');
    
    // Prompt brugeren til at indtaste en ny vægt i gram
    const weight = prompt("Enter the new weight in grams:");
    // Kontroller at der er indtastet en gyldig vægt
    if (weight && !isNaN(weight)) {
        // Send en PUT-anmodning til serveren med den nye vægt
        fetch(`http://localhost:3000/tracker/user/meal/${mealID}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ weight: parseFloat(weight) }) // Konverterer streng til float og sætter ind i JSON
        })
        .then(response => {
            // Tjek om anmodningen lykkedes
            if (!response.ok) {
                throw new Error('Failed to update meal');
            }
            return response.json();
        })
        .then(data => {
            console.log('Meal updated:', data);
            // Henter opdateret opskriftsinformation, da næringsværdierne måske skal justeres
            return fetch(`http://localhost:3000/tracker/user/recipe/${recipeID}`);
        })
        .then(response => response.json())
        .then(recipe => {
            // Opdaterer tabelcellerne i UI med den nye vægt og justerede næringsværdier
            row.cells[1].textContent = `${weight}g`;
            row.cells[2].textContent = `${(recipe.kcal / 100 * weight).toFixed(2)} kcal`;
            row.cells[3].textContent = `${(recipe.protein / 100 * weight).toFixed(2)} g`;
            row.cells[4].textContent = `${(recipe.fat / 100 * weight).toFixed(2)} g`;
            row.cells[5].textContent = `${(recipe.fiber / 100 * weight).toFixed(2)} g`;
        })
        .catch(error => {
            console.error('Failed to update meal:', error);
            alert('Failed to update meal: ' + error.message); // Viser en fejlmeddelelse, hvis opdateringen mislykkes
        });
    }
}

// Funktion til at slette et måltid fra databasen og fjerne det fra tabellen
function deleteMeal(element) {
    // Finder den nærmeste tabelrække til elementet, som repræsenterer det pågældende måltid
    const row = element.closest('tr');
    // Henter måltidets ID fra data-attribut på rækken
    const mealID = row.getAttribute('data-meal-id');
    console.log("Deleting meal with ID:", mealID);

    // Sender en DELETE-anmodning til serveren for at slette måltidet
    fetch(`http://localhost:3000/tracker/user/meal/${mealID}`, {
        method: 'DELETE',
    })
    .then(response => {
        // Tjekker om anmodningen om at slette lykkedes
        if (!response.ok) {
            throw new Error('Failed to delete meal');
        }
        console.log('Meal deleted successfully');
        // Fjerner rækken fra tabellen i brugergrænsefladen
        row.remove();
    })
    .catch(error => {
        console.error('Error deleting meal:', error); // Logger en fejl, hvis sletning mislykkes
    });
}