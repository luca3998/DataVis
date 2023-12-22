//This file hosts global variable that are used in multiple views and visualizations across the dashboard.

//Array of the country names ['Belgium','Netherlands']
export const selectedCountries = [];
//Array of the country codes ['BE','NL']
export const countryArray = [];

export const transitionTime = 1000;
export const total_import = "datasets/totals/import.csv";
export const total_export = "datasets/totals/export.csv";
export const country_data = "countries.csv";
export const slider = document.getElementById("yearSlider");

let sliderValue = slider.value;

// Function to get the current slider value
export function getSliderValue() {
    return sliderValue;
}

//React when value of slider changes
slider.addEventListener("input", function() {
    sliderValue = this.value;
});

export let is_import_value;

//React when value of export/import toggle button changes and update the global is_import_value variable
document.getElementById("toggle").addEventListener("change",function(){
    is_import_value = this.checked ? 1:0;
    document.dispatchEvent(new Event("is_import_value_changed"));
});

//Function called by other files to obtain current is_import_value
export function getImportValue(){
    return is_import_value;
};

//Function called by other files to obtain current selected country list
export function getCountries(){
    return countryArray
};