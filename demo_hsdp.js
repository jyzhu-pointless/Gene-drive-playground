// A web framework for gene drive simulations
// author: Jinyu Zhu

// DOM
function append_output(dom, text) {
    new_output = document.createElement('p');
    new_output.innerHTML = text;
    dom.appendChild(new_output);
}

// Public variables and functions
// Unused
class simulation {
    constructor() {
        // Definition of "population":
        // population = { male: [], female: [] };
        // The subarray are filled with "individual"s
        this.population = { "male": [], "female": [] };
        this.cycle = 0; // generation
        this.population_size = 0;
    }
    get population_size() { // getter method
        this.population_size = population.male.length + population.female.length;
        return this.population_size;
    }
};

class individual {
    constructor(sex, age, genotype) {
        this.sex = sex;
        this.age = age;
        this.genotype = genotype;
        this.tag = undefined; // This is useful in some situations where we need to record something.
    }
}
var genotype_sort = { "d": 1, "R": 2, "r": 3, "+": 10 };

var population = { "male": [], "female": [] };

function get_population_size() {
    return population.male.length + population.female.length;
}

var population_size = get_population_size();

function random_int(minN, maxN) {
    return minN + Math.round(Math.random() * (maxN - minN));
}

function sample_without_replace(list, sample_size) {
    var ret = [];
    for (var i = 0; i < sample_size; i++) {
        ret[i] = random_int(0, list.length - 1);
        for (var j = 0; j < i; j++) {
            if (ret[i] == ret[j]) {
                i--;
                break;
            }
        }
    }
    for (var i = 0; i < sample_size; i++) {
        ret[i] = list[ret[i]];
    }
    return ret;
}

function homing_suppression_drive_panmictic_demo() {
    // Female sterile homing drive without resistance
    // Clear output
    // Clear plot
    setTimeout(() => {
        hsdp_output.innerHTML = "";
        homing_supp_pan_chart.data.labels = [];
        homing_supp_pan_chart.data.datasets.forEach(dataset => {
            dataset.data = [];
        });
        homing_supp_pan_chart.update();
    }, 100);

    // Parameters
    population = { male: [], female: [] };
    var capacity = document.getElementById("hsdp-capacity").value;
    var release_size = capacity / 2 * document.getElementById("hsdp-drop").value;
    var low_density_growth_rate = document.getElementById("hsdp-ldgr").value;
    var drive_efficiency = document.getElementById("hsdp-dcr").value;
    var resistance_2_formation_rate_if_not_converted = document.getElementById("hsdp-r2").value; // if not converted
    var resistance_1_formation_rate_if_not_resistance_2 = 0.01; // if not to r2
    var drive_fitness = document.getElementById("hsdp-fit").value;
    var max_attempts_to_find_a_mate = 10;
    var egg_num_per_female = 50;
    var max_generations = 100;
    var cyc = 0;
    var exit_flag = 0;
    var stats = [];
    let out = "Initial parameters: " + JSON.stringify({
        "capacity": capacity,
        "release_size": release_size,
        "low_density_growth_rate": low_density_growth_rate,
        "drive_efficiency": drive_efficiency,
        "resistance_2_formation_rate_if_not_converted": resistance_2_formation_rate_if_not_converted,
        "resistance_1_formation_rate_if_not_resistance_2": resistance_1_formation_rate_if_not_resistance_2,
        "drive_fitness": drive_fitness,
        "max_attempts_to_find_a_mate": max_attempts_to_find_a_mate,
        "egg_num_per_female": egg_num_per_female,
        "max_generations": max_generations
    })
    console.log(out);
    append_output(hsdp_output, out + "<br>");

    function initialize_population() {
        for (var i = 1; i <= capacity / 2; i++) {
            population.male.push(new individual("male", 0, "++"));
            population.female.push(new individual("female", 0, "++"));
        }
    }

    function release_drive_carriers() {
        // Only male drive carriers are released
        // Heterozygotes release
        for (var i = 1; i <= release_size; i++) {
            population.male.push(new individual("male", 0, "d+"));
        }
    }

    function is_sterile(ind) {
        // Only female drive homozygotes are sterile
        if (ind == null || ind == undefined) {
            return true;
        }
        if (ind.sex == "female" && (ind.genotype == "dd" || ind.genotype == "dr" || ind.genotype == "rr")) {
            return true;
        }
        return false;
    }

    function fitness(ind) {
        if (ind.genotype == "dd") return drive_fitness;
        if (ind.genotype == "d+" || ind.genotype == "dr" || ind.genotype == "dR") return Math.sqrt(drive_fitness);
        return 1.0;
    }

    function select_mate() {
        var mate = null;
        // Sample a list of males
        var sampled_male = sample_without_replace(population.male, Math.min(max_attempts_to_find_a_mate, population.male.length));
        for (var male_ind_i in sampled_male) {
            // The chance of a male being selected is equal to 0.5 * his fitness
            // If a male is selected, the female does not continue to find other males
            // Otherwise, the female try another male, until her maximum attempts
            if (0.5 * fitness(sampled_male[male_ind_i]) >= Math.random()) {
                mate = sampled_male[male_ind_i];
                break;
            }
        }
        return mate;
    }

    function gamate_generation(ind) {
        // drive event
        if (ind.genotype == "d+") {
            if (drive_efficiency >= Math.random()) {
                return ["d", "d"];
            } else if (resistance_2_formation_rate_if_not_converted >= Math.random()) {
                return ["d", "r"];
            } else if (resistance_1_formation_rate_if_not_resistance_2 >= Math.random()) {
                return ["d", "R"];
            } else return ["d", "+"];
        }
        return ind.genotype.split('');
    }

    function mature() {
        for (var i in population.male) {
            population.male[i].age++;
        }
        for (var i in population.female) {
            population.female[i].age++;
        }
    }

    function cross(mother, father) {
        var father_gamate = gamate_generation(father);
        var mother_gamate = gamate_generation(mother);
        var child_first_allele = father_gamate[random_int(1, father_gamate.length) - 1];
        var child_second_allele = mother_gamate[random_int(1, mother_gamate.length) - 1];
        var child_sex = Math.random() >= 0.5 ? "male" : "female";
        if (genotype_sort[child_first_allele] > genotype_sort[child_second_allele]) {
            return new individual(child_sex, 0, child_second_allele + child_first_allele);
        } else {
            return new individual(child_sex, 0, child_first_allele + child_second_allele);
        }
    }

    function next_generation(female_ind, male_ind) {
        if (is_sterile(female_ind)) return;
        if (is_sterile(male_ind)) return;

        // console.log("not_sterile");
        var fecundity = fitness(female_ind) * low_density_growth_rate / (((low_density_growth_rate - 1.0) * population_size / capacity) + 1.0);

        for (var i = 0; i < egg_num_per_female; i++) {
            var newborn = cross(female_ind, male_ind);
            if (fecundity / 25.0 >= Math.random()) {
                if (newborn.sex == "male") {
                    population.male.push(newborn);
                } else {
                    population.female.push(newborn);
                }
            }
        }
    }

    function death() {
        for (var i = population.male.length - 1; i >= 0; i--) {
            if (population.male[i].age > 0) {
                population.male.splice(i, 1);
            }
        }
        for (var i = population.female.length - 1; i >= 0; i--) {
            if (population.female[i].age > 0) {
                population.female.splice(i, 1);
            }
        }
    }

    function output_stats() {
        var male_dd = 0,
            female_dd = 0,
            male_dw = 0,
            female_dw = 0,
            male_ww = 0,
            female_ww = 0,
            male_dr = 0,
            female_dr = 0,
            male_rw = 0,
            female_rw = 0,
            male_rr = 0,
            female_rr = 0,
            male_dR = 0,
            female_dR = 0,
            male_Rr = 0,
            female_Rr = 0,
            male_Rw = 0,
            female_Rw = 0,
            male_RR = 0,
            female_RR = 0,
            male_has_d = 0,
            female_has_d = 0,
            male_has_r = 0,
            female_has_r = 0,
            male_has_R = 0,
            female_has_R = 0;
        population_size = get_population_size();
        for (var i in population.male) {
            if (population.male[i].genotype == "dd") male_dd++;
            if (population.male[i].genotype == "d+") male_dw++;
            if (population.male[i].genotype == "++") male_ww++;
            if (population.male[i].genotype == "dr") male_dr++;
            if (population.male[i].genotype == "rr") male_rr++;
            if (population.male[i].genotype == "r+") male_rw++;
            if (population.male[i].genotype == "dR") male_dR++;
            if (population.male[i].genotype == "Rr") male_Rr++;
            if (population.male[i].genotype == "R+") male_Rw++;
            if (population.male[i].genotype == "RR") male_RR++;
            if (population.male[i].genotype.indexOf("d") != -1) male_has_d++;
            if (population.male[i].genotype.indexOf("r") != -1) male_has_r++;
            if (population.male[i].genotype.indexOf("R") != -1) male_has_R++;
        }
        for (var i in population.female) {
            if (population.female[i].genotype == "dd") female_dd++;
            if (population.female[i].genotype == "d+") female_dw++;
            if (population.female[i].genotype == "++") female_ww++;
            if (population.female[i].genotype == "dr") female_dr++;
            if (population.female[i].genotype == "rr") female_rr++;
            if (population.female[i].genotype == "r+") female_rw++;
            if (population.female[i].genotype == "dR") female_dR++;
            if (population.female[i].genotype == "Rr") female_Rr++;
            if (population.female[i].genotype == "R+") female_Rw++;
            if (population.female[i].genotype == "RR") female_RR++;
            if (population.female[i].genotype.indexOf("d") != -1) female_has_d++;
            if (population.female[i].genotype.indexOf("r") != -1) female_has_r++;
            if (population.female[i].genotype.indexOf("R") != -1) female_has_R++;
        }
        var total_dd = male_dd + female_dd;
        var total_dw = male_dw + female_dw;
        var total_ww = male_ww + female_ww;
        var total_dr = male_dr + female_dr;
        var total_rr = male_rr + female_rr;
        var total_rw = male_rw + female_rw;
        var total_dR = male_dR + female_dR;
        var total_Rr = male_Rr + female_Rr;
        var total_Rw = male_Rw + female_Rw;
        var total_RR = male_RR + female_RR;
        var total_has_d = male_has_d + female_has_d;
        var total_has_r = male_has_r + female_has_r;
        var total_has_R = male_has_R + female_has_R;
        var rate_dd = (0.0 + total_dd) / population_size;
        var rate_dw = (0.0 + total_dw) / population_size;
        var rate_ww = (0.0 + total_ww) / population_size;
        var rate_dr = (0.0 + total_dr) / population_size;
        var rate_rr = (0.0 + total_rr) / population_size;
        var rate_rw = (0.0 + total_rw) / population_size;
        var rate_dR = (0.0 + total_dR) / population_size;
        var rate_Rr = (0.0 + total_Rr) / population_size;
        var rate_Rw = (0.0 + total_Rw) / population_size;
        var rate_RR = (0.0 + total_RR) / population_size;
        var rate_d = (total_dd + 0.5 * total_dw + 0.5 * total_dr + 0.5 * total_dR) / population_size;
        var rate_w = (total_ww + 0.5 * total_dw + 0.5 * total_rw + 0.5 * total_Rw) / population_size;
        var rate_r = (total_rr + 0.5 * total_dr + 0.5 * total_rw + 0.5 * total_Rr) / population_size;
        var rate_R = (total_RR + 0.5 * total_dR + 0.5 * total_Rw + 0.5 * total_Rr) / population_size;
        var rate_has_d = (0.0 + total_has_d) / population_size;
        var rate_has_r = (0.0 + total_has_r) / population_size;
        var rate_has_R = (0.0 + total_has_R) / population_size;

        var output_obj = {
            "generation": cyc,
            "population_size": population_size,
            "male": population.male.length,
            "female": population.female.length,
            "male_dd": male_dd,
            "male_dw": male_dw,
            "male_ww": male_ww,
            "male_dr": male_dr,
            "male_rr": male_rr,
            "male_rw": male_rw,
            "male_dR": male_dR,
            "male_Rr": male_Rr,
            "male_Rw": male_Rw,
            "male_RR": male_RR,
            "male_has_d": male_has_d,
            "male_has_r": male_has_r,
            "male_has_R": male_has_R,
            "female_dd": female_dd,
            "female_dw": female_dw,
            "female_ww": female_ww,
            "female_dr": female_dr,
            "female_rr": female_rr,
            "female_rw": female_rw,
            "female_dR": female_dR,
            "female_Rr": female_Rr,
            "female_Rw": female_Rw,
            "female_RR": female_RR,
            "female_has_d": female_has_d,
            "female_has_r": female_has_r,
            "female_has_R": female_has_R,
            "total_dd": total_dd,
            "total_dw": total_dw,
            "total_ww": total_ww,
            "total_dr": total_dr,
            "total_rr": total_rr,
            "total_rw": total_rw,
            "total_dR": total_dR,
            "total_Rr": total_Rr,
            "total_Rw": total_Rw,
            "total_RR": total_RR,
            "total_has_d": total_has_d,
            "total_has_r": total_has_r,
            "total_has_R": total_has_R,
            "rate_dd": rate_dd,
            "rate_dw": rate_dw,
            "rate_ww": rate_ww,
            "rate_dr": rate_dr,
            "rate_rr": rate_rr,
            "rate_rw": rate_rw,
            "rate_dR": rate_dR,
            "rate_Rr": rate_Rr,
            "rate_Rw": rate_Rw,
            "rate_RR": rate_RR,
            "rate_d": rate_d,
            "rate_w": rate_w,
            "rate_r": rate_r,
            "rate_R": rate_R,
            "rate_has_d": rate_has_d,
            "rate_has_r": rate_has_r,
            "rate_has_R": rate_has_R,
        }
        stats.push(output_obj);

        let out = JSON.stringify(output_obj);

        console.log(out);
        append_output(hsdp_output, out + "<br>");

        // add data to chart
        setTimeout(() => {
            homing_supp_pan_chart.data.labels.push(output_obj["generation"]);
            homing_supp_pan_chart.data.datasets[0].data.push((0.0 + output_obj["population_size"]) / capacity);
            homing_supp_pan_chart.data.datasets[1].data.push(output_obj["rate_d"]);
            homing_supp_pan_chart.data.datasets[2].data.push(output_obj["rate_r"]);
            homing_supp_pan_chart.data.datasets[3].data.push(output_obj["rate_R"]);
            homing_supp_pan_chart.update();
        }, 100);



        /*if (output_obj["rate_dd"] == 1.0 || output_obj["population_size"] == 0 || output_obj["male"] == 0 || output_obj["female"] == 0) {
            exit_flag = 1;
        }*/
        if (cyc && output_obj["population_size"] == 0) {
            exit_flag = 1;
        } else if (cyc && output_obj["total_has_d"] == 0) {
            exit_flag = 2;
        }
        return;
    }

    function main() {
        initialize_population();
        output_stats();
        release_drive_carriers();
        for (cyc = 1; cyc <= max_generations; cyc++) {
            if (exit_flag) {
                break;
            }
            population_size = get_population_size();
            // console.log("ok get size");
            mature();
            // console.log("ok mature");
            for (var j in population.female) {
                var mate = select_mate();
                // console.log("ok selection");
                next_generation(population.female[j], mate);
            }
            death();
            output_stats();
        }
        if (exit_flag == 1) {
            console.log("End of simulation: Suppressed");
            append_output(hsdp_output, "End of simulation: Suppressed" + "<br>");
        } else if (exit_flag == 2) {
            console.log("End of simulation: Drive lost");
            append_output(hsdp_output, "End of simulation: Drive lost" + "<br>");
        } else {
            console.log("End of simulation: Long");
            append_output(hsdp_output, "End of simulation: Long" + "<br>");
        }
        return;
    }

    main();
}