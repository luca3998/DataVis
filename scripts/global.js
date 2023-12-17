// global.js

export const selectedCountries = [];
export const colors = {
    "Russia": "red",
    "France": "blue",
    "Germany": "green"
}
export const transitionTime = 1000;
export const dataset = "fakedata.csv";
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
