function toggleInstructions(recipeName) {
    const instructionsDiv = document.getElementById(`${recipeName}-instructions`);
    const toggleButton = document.querySelector(`.toggle-instructions-btn[data-recipe-name="${recipeName}"]`);

    if (!instructionsDiv.style.maxHeight || instructionsDiv.style.maxHeight === '0px') {
        instructionsDiv.style.maxHeight = instructionsDiv.scrollHeight + 'px';
        toggleButton.innerText = 'Show Less';
    } else {
        instructionsDiv.style.maxHeight = '0px';
        toggleButton.innerText = 'Instructions';
    }
}

$(document).ready(function () {
    const googleTranslateApiKey = 'AIzaSyA6S9LAB-j7YsPHQi1TibssrSMXD13q8BQ';
    let selectedLanguage = 'en';
    let recipe = '';
    const separator = '---';
    let recipeList = [];

    function Recipe(name, instructions, ingredientList, image, youtubeLink) {
        this.name = name;
        this.instructions = instructions;
        this.ingredientList = ingredientList;
        this.image = image;
        this.youtubeLink = youtubeLink;
    }

    function fetchRecipes(recipe) {
        $.ajax({
            url: `https://www.themealdb.com/api/json/v1/1/search.php?s=${recipe}`,
            method: 'GET',
            success: function (recipeData) {
                const meals = recipeData.meals;

                if (meals) {
                    const delayInterval = 1000;

                    function sleep(ms) {
                        return new Promise(resolve => setTimeout(resolve, ms));
                    }

                    (async function () {
                        for (let index = 0; index < meals.length; index++) {
                            const meal = meals[index];
                            const name = meal['strMeal'];
                            const instructions = meal['strInstructions'];
                            let ingredientsList = [];
                            const image = meal['strMealThumb'];
                            const youtubeLink = meal['strYoutube'];

                            let recipeString = `Recipe ${index + 1}: ${name}${separator}${instructions}`;

                            for (let i = 1; i <= 20; i++) {
                                const ingredient = meal['strIngredient' + i];
                                const measurement = meal['strMeasure' + i];
                                if (ingredient && measurement) {
                                    let ingredientData = `${ingredient} - Measure: ${measurement}`;
                                    recipeString += separator + ingredientData;
                                    ingredientsList.push(ingredientData);
                                }
                            }

                            if (selectedLanguage !== 'en') {
                                translateText(recipeString, translatedRecipe => {
                                    let tokenizedRecipe = translatedRecipe.split(separator);
                                    let name = tokenizedRecipe[0];
                                    let instructions = tokenizedRecipe[1];
                                    ingredientsList = tokenizedRecipe.slice(2);

                                    recipeList.push(new Recipe(name, instructions, ingredientsList, image, youtubeLink));
                                    createRecipeCard(recipeList);
                                }, 'en', selectedLanguage);
                            } else {
                                recipeList.push(new Recipe(name, instructions, ingredientsList, image, youtubeLink));
                                createRecipeCard(recipeList);
                            }

                            await sleep(delayInterval);
                        }
                    })();
                } else {
                    console.error('No recipes found.');
                }
            },
            error: function (recipeError) {
                console.error('Error fetching recipe data:', recipeError);
            }
        });
    }

    function createRecipeCard(recipes) {
        document.getElementById('recipeCards').innerHTML = '';

        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.classList.add('card', 'm-3', 'col-md-4');

            const cardContent = `
                <img src="${recipe.image}" class="card-img-top" alt="${recipe.name}">
                <div class="card-body">
                    <h5 class="card-title">${recipe.name}</h5>
                    <a href="${recipe.youtubeLink}" class="btn btn-primary">Watch on YouTube</a>
                    <h5>Ingredients</h5>
                    <ul class="list-group">
                        ${recipe.ingredientList.map(ingredient => `<li class="list-group-item">${ingredient}</li>`).join('')}
                    </ul>
                    <p class="card-text" id="${recipe.name}-instructions" style="max-height: 0px; overflow: hidden;">${recipe.instructions}</p>
                    <h5><span class="read-more-link toggle-instructions-btn" data-recipe-name="${recipe.name}">Instructions</span></h5>
                </div>
            `;

            card.innerHTML = cardContent;
            document.getElementById('recipeCards').appendChild(card);
        });

        document.querySelectorAll('.toggle-instructions-btn').forEach(button => {
            button.addEventListener('click', function() {
                const recipeName = this.dataset.recipeName;
                toggleInstructions(recipeName);
            });
        });
    }

    function translateText(text, callback, source, target = 'en') {
        $.ajax({
            url: `https://translation.googleapis.com/language/translate/v2?key=${googleTranslateApiKey}`,
            method: 'POST',
            data: {
                q: text,
                source: source,
                target: target,
            },
            success: function (response) {
                callback(response.data.translations[0].translatedText);
            },
            error: function (error) {
                console.error('Error fetching translation:', error);
                callback(text);
            }
        });
    }

    function updateDropdownText() {
        $('#dropdownMenuButton').text(selectedLanguage.toUpperCase());
    }

    $('.dropdown-item').on('click', function () {
        selectedLanguage = $(this).data('language');
        updateDropdownText();
    });

    $('#recipeSearch').on('keydown', function (event) {
        if (event.key === 'Enter') {
            recipeList = [];
            recipe = $(this).val();
            if (recipe !== '') {
                if (selectedLanguage.match('en')) {
                    fetchRecipes(recipe);
                } else {
                    translateText(recipe, translateText => {
                        fetchRecipes(translateText);
                    }, selectedLanguage);
                }
            }
        }
    });

    updateDropdownText();
});
