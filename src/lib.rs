extern crate wasm_bindgen;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);
}

macro_rules! console_log {
    ($($t:tt)*) => (log(&format_args!($($t)*).to_string()))
}

#[wasm_bindgen]
pub fn greet() {
    console_log!("Hello World!");
}

#[wasm_bindgen]
pub struct ColorArray {
    pub length: usize,
    colors: Vec<f32>
}

#[wasm_bindgen]
impl ColorArray {

    pub fn new(length: usize) -> ColorArray {
        ColorArray {
            length,
            colors: vec![0.0; 3 * length]
        }
    }

    pub fn colors(&self) -> *const f32 {
        self.colors.as_ptr()
    }

    pub fn log(&self) {
        for i in (0..).step_by(3).take(self.length) {
            console_log!("{}, {}, {}", self.colors[i], self.colors[i + 1], self.colors[i + 2]);
        }
    }

}

pub fn mix(c1: &ColorArray, c2: &ColorArray, result_array: &mut ColorArray) {
    for index in 0..result_array.length {
        let i = index * 3;
        result_array.colors[i] = (c1.colors[i] + c2.colors[i]) / 2.0;
        result_array.colors[i + 1] = (c1.colors[i + 1] + c2.colors[i + 1]) / 2.0;
        result_array.colors[i + 2] = (c1.colors[i + 2] + c2.colors[i + 2]) / 2.0;
    }
}