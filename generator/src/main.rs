use collections::HashMap;
use convert_case::{Case, Casing};
use std::{collections, fs};

static COL_OP: usize = 1;
static COL_NATIVE: usize = 2;
static COL_CLASS: usize = 3;
static COL_NOTES: usize = 4;
static COL_INPUT: usize = 5;
static COL_OUTPUT: usize = 6;

fn main() {
    let args: Vec<String> = std::env::args().collect();
    let input_file = args
        .get(1)
        .unwrap_or_else(|| panic!("Provide input file name"));

    let content = fs::read_to_string(input_file).unwrap();

    let mut classes_list: HashMap<String, HashMap<String, String>> = HashMap::new();

    for line in content.lines().skip(2) {
        let columns: Vec<&str> = line.split('|').collect();

        let notes = columns.get(COL_NOTES).unwrap();

        if notes.contains("not-a-class") || notes.contains("keyword") || notes.contains("nop") {
            continue;
        }

        let native = columns.get(COL_NATIVE).unwrap();
        let class = columns.get(COL_CLASS).unwrap();

        let class_name = class.split('.').nth(0).unwrap().to_case(Case::Pascal);
        let class_member = class.split('.').nth(1).unwrap().to_case(Case::Pascal);

        if !classes_list.contains_key(&class_name) {
            classes_list.insert(class_name.clone(), HashMap::new());
        }

        let map = classes_list.get_mut(&class_name).unwrap();

        let is_condition = if notes.contains("condition") { 1 } else { 0 };

        let input = columns.get(COL_INPUT).unwrap();
        let params: Vec<String> = input
            .split(',')
            .enumerate()
            .map(|(i, p)| {
                let p = p.trim();
                if p.len() == 0 {
                    String::from("")
                } else {
                    let _type = match p.to_ascii_lowercase().as_str() {
                        "float" => String::from("%f"),
                        "int" => String::from("%i"),
                        "string" => String::from("%s"),
                        _ => format!(": {}", p),
                    };
                    format!("\"_p{}{}\"", i + 1, _type)
                }
            })
            .collect();
        let description = format!("{},{},{},({})", "0000", is_condition, 0, params.join(" "));
        map.insert(class_member, description);
    }

    let mut classes_names: Vec<&str> = classes_list.keys().map(|line| line.trim()).collect();
    classes_names.sort();

    println!("; autogenerated from {}\n", input_file);
    println!("#CLASSESLIST");

    for class_name in classes_names.iter() {
        println!("{}", class_name);
    }

    println!("\n#CLASSES");

    for &class_name in classes_names.iter() {
        println!("${}", class_name.trim());
        println!("$BEGIN");

        let members = classes_list.get(class_name).unwrap();
        let mut member_names: Vec<&String> = members.keys().collect();
        member_names.sort();

        for member_name in member_names {
            let description = members.get(member_name).unwrap();
            println!("{},{}", member_name, description);
        }

        println!("$END\n");
    }

    println!("#EOF");
}