import { countryArray, selectedCountries } from "./global.js";
import { updateCountry } from "./script.js";

// Toggle the dropdown visibility
export function toggleDropdown() {
    var dropdown = document.getElementById("myDropdown");
    dropdown.style.display = (dropdown.style.display === "block") ? "none" : "block";
  }

 export function updateSelectedCountries(checkbox) {
        
            // Check if the checkbox is checked or unchecked
            document.dispatchEvent(new Event("countryArrayChange"));
            if (checkbox.checked) {
                // If checked, add the value to the array
                countryArray.push(checkbox.value);
                var countryLabel = checkbox.parentNode.textContent.trim();
            console.log(countryLabel);
            selectedCountries.push(countryLabel)
                updateCountry(countryLabel, 1)
            } else {
                // If unchecked, remove the value from the array
                var index = countryArray.indexOf(checkbox.value);
                if (index !== -1) {
                    var countryLabel = checkbox.parentNode.textContent.trim();
                    console.log(countryLabel);
                    countryArray.splice(index, 1);
                    selectedCountries.splice(index,1)
                    updateCountry(countryLabel, 0)
                }
            }

            // Display selected countries (you can modify this part according to your needs)
            console.log('Selected countries: ' + countryArray.join(', '));
            
        }

        export function checkAllCountries() {
            var checkboxes = Array.from(document.querySelectorAll('input[name="country"]'));
        
            // Check if all countries in countryArray are checked
            var allChecked = countryArray.every(country => checkboxes.some(checkbox => checkbox.value === country && checkbox.checked));
        
            // If not all countries are checked, check the remaining ones
            if (!allChecked) {
                checkboxes.forEach(checkbox => {
                    if (countryArray.includes(checkbox.value) && !checkbox.checked) {
                        checkbox.checked = true;
                        //updateSelectedCountries(checkbox);
                    }
                });
            }
                // Unselect checkboxes for countries not present in countryArray
    checkboxes.forEach(checkbox => {
        if (!countryArray.includes(checkbox.value) && checkbox.checked) {
            checkbox.checked = false;
            updateSelectedCountries(checkbox);
        }
    });
        }