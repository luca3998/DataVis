// global.js
export const selectedCountries = [];
export const countryArray = [];
export const colors = {
    "Russia": "red",
    "France": "blue",
    "Germany": "green"
};
export const transitionTime = 1000;
export const dataset = "fakedata.csv";
export const total_import = "datasets/totals/import.csv";
export const total_export = "datasets/totals/export.csv";
export const country_data = "countries.csv";
export const slider = document.getElementById("yearSlider");

// Declare sliderValue outside the event listener
let sliderValue = slider.value;

// Function to get the current slider value
export function getSliderValue() {
    return sliderValue;
}

slider.addEventListener("input", function() {
    // Access the slider value using this.value
    sliderValue = this.value;
    console.log(sliderValue);
});

export let is_import_value;

// Add event listener for Import button
document.getElementById("import_button").addEventListener("click", function() {
    is_import_value = 1;
    console.log("Import button");
    // Trigger a custom event or call handleImportChange directly
    document.dispatchEvent(new Event("is_import_value_changed"));
});

// Add event listener for Export button
document.getElementById("export_button").addEventListener("click", function() {
    is_import_value = 0;
    console.log("Export button");
    // Trigger a custom event or call handleImportChange directly
    document.dispatchEvent(new Event("is_import_value_changed"));
});

export function getImportValue(){
    console.log(is_import_value);
    return is_import_value;
};