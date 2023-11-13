function clearSearch() {
    document.getElementById('recipeSearch').value = ''
    document.getElementById('recipeCards').innerHTML = ''
    updateContainerMarginTop(false);
}

document.getElementById('recipeSearch').addEventListener('input', function () {
    var clearButton = document.querySelector('.clear-button')
    if (this.value.length > 0) {
        clearButton.style.display = 'block'
    }
})

function updateContainerMarginTop(hasSearchResults) {
    const container = document.querySelector('.container')
    const initialMarginTop = 30
    const reducedMarginTop = 5

    if (hasSearchResults) {
        container.style.marginTop = `${reducedMarginTop}vh`
    } else {
        container.style.marginTop = `${initialMarginTop}vh`
    }
}

$(document).ready(function () {
    const googleTranslateApiKey = 'AIzaSyA6S9LAB-j7YsPHQi1TibssrSMXD13q8BQ';
    let selectedLanguage = 'en'
    let recipe = ''
    const separator = '---'
    let recipeList = []

    function Recipe(name, instructions, ingredientList, image, youtubeLink) {
        this.name = name
        this.instructions = instructions
        this.ingredientList = ingredientList
        this.image = image
        this.youtubeLink = youtubeLink
    }

    function fetchRecipes(recipe) {
        $.ajax({
            url: `https://www.themealdb.com/api/json/v1/1/search.php?s=${recipe}`,
            method: 'GET',
            success: function (recipeData) {
                const meals = recipeData.meals

                if (meals) {
                    const delayInterval = 1000;

                    function sleep(ms) {
                        return new Promise(resolve => setTimeout(resolve, ms))
                    }

                    (async function () {
                        for (let index = 0; index < meals.length; index++) {
                            const meal = meals[index]
                            const name = meal['strMeal']
                            const instructions = meal['strInstructions']
                            let ingredientsList = []
                            const image = meal['strMealThumb']
                            const youtubeLink = meal['strYoutube']

                            let recipeString = `Recipe ${index + 1}: ${name}${separator}${instructions}`

                            for (let i = 1; i <= 20; i++) {
                                const ingredient = meal['strIngredient' + i]
                                const measurement = meal['strMeasure' + i]
                                if (ingredient && measurement) {
                                    let ingredientData = `${ingredient} - Measure: ${measurement}`
                                    recipeString += separator + ingredientData
                                    ingredientsList.push(ingredientData)
                                }
                            }

                            if (selectedLanguage !== 'en') {
                                translateText(recipeString, translatedRecipe => {
                                    let tokenizedRecipe = translatedRecipe.split(separator)
                                    let name = tokenizedRecipe[0]
                                    let instructions = tokenizedRecipe[1]
                                    ingredientsList = tokenizedRecipe.slice(2)

                                    recipeList.push(new Recipe(name, instructions, ingredientsList, image, youtubeLink))
                                    createRecipeCard(recipeList)
                                    updateContainerMarginTop(recipeList.length > 0)
                                }, 'en', selectedLanguage)
                            } else {
                                recipeList.push(new Recipe(name, instructions, ingredientsList, image, youtubeLink))
                                createRecipeCard(recipeList)
                            }

                            await sleep(delayInterval)
                        }
                    })()
                } else {
                    console.error('No recipes found.')
                    updateContainerMarginTop(false)
                }
            },
            error: function (recipeError) {
                console.error('Error fetching recipe data:', recipeError)
                updateContainerMarginTop(false)
            }
        })
    }

    function createRecipeCard(recipes) {
        document.getElementById('recipeCards').innerHTML = ''
    
        recipes.forEach(recipe => {
            const card = document.createElement('div');
            card.classList.add('card', 'm-3', 'col-sm-12')
    
            const cardContent = `
                <div class="row flex-column-reverse flex-md-row">
                    <div class="col-sm-4">
                        <img src="${recipe.image}" class="card-img-top" alt="${recipe.name}">
                    </div> 
    
                    <div class="col-sm-8">
                        <div class="card-body">
                            <div class="d-flex justify-content-between flex-column flex-md-row">
                                <h1 class="card-title">${recipe.name}</h1>
                                <a target="_blank" href="${recipe.youtubeLink}">
                                    <button class="btn btn-danger my-2">Watch on YouTube</button>
                                </a>
                            </div>
                            <p class="card-text" id="${recipe.name}-instructions">${recipe.instructions}</p>
                        </div>
                    </div>
                </div>
    
                <h4 class="mt-5 text-center">Ingredients</h4>
                <div class="row">
                    ${recipe.ingredientList.map(ingredient => `
                        <div class="list-group col-sm-12 col-md-6 col-lg-3 ingredient-div">
                            <div class="list-group-item ingredient-item">
                                ${ingredient}
                            </div>
                        </div>
                    `).join('')}
                </div>
            `
    
            card.innerHTML = cardContent;
            document.getElementById('recipeCards').appendChild(card);
        })
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
                callback(response.data.translations[0].translatedText)
            },
            error: function (error) {
                console.error('Error fetching translation:', error)
                callback(text)
            }
        });
    }

    function updateDropdownText() {
        $('#dropdownMenuButton').text(selectedLanguage.toUpperCase())
    }

    $('.dropdown-item').on('click', function () {
        selectedLanguage = $(this).data('language')
        updateDropdownText()
    });

    $('#recipeSearch').on('keydown', function (event) {
        if (event.key === 'Enter') {
            recipeList = []
            recipe = $(this).val()
            if (recipe !== '') {
                updateContainerMarginTop(true)
                if (selectedLanguage.match('en')) {
                    fetchRecipes(recipe)
                } else {
                    translateText(recipe, translateText => {
                        fetchRecipes(translateText)
                    }, selectedLanguage)
                }
            }
        }
    })

    updateDropdownText()
    updateContainerMarginTop(false)
})
