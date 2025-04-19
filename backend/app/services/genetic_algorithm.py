import numpy as np
import random
from sklearn.ensemble import RandomForestClassifier, RandomForestRegressor
from sklearn.svm import SVC
from sklearn.neural_network import MLPClassifier, MLPRegressor
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, mean_squared_error
from sklearn.utils.multiclass import type_of_target

random.seed(42)
np.random.seed(42)

# --- Hyperparameter Ranges ---
HYPERPARAM_RANGES = {
    "random_forest": {
        "n_estimators": (10, 200),  # int
        "max_depth": (2, 30),       # int
        "min_samples_split": (2, 10),  # int
        "min_samples_leaf": (1, 10),   # int
        "max_features": (0.1, 1.0),    # float (fraction of features)
    },
    "svm": {
        "C": (0.1, 10.0),          # float
        "gamma": (0.001, 1.0),     # float
        "tol": (1e-5, 1e-1),       # float
    },
    "neural_network": {
        "hidden_layer_sizes": (1, 3),      # int (number of layers)
        "layer_size": (10, 200),           # int (neurons per layer)
        "alpha": (0.0001, 0.1),            # float (L2 penalty)
        "learning_rate_init": (0.0001, 0.1),  # float
    }
}

def generate_chromosome(model_type):
    chromosome = {}
    for key, val_range in HYPERPARAM_RANGES[model_type].items():
        if isinstance(val_range[0], float):
            chromosome[key] = random.uniform(*val_range)
        else:
            chromosome[key] = random.randint(*val_range)
    return chromosome

def create_population(size, model_type):
    return [generate_chromosome(model_type) for _ in range(size)]

def evaluate_fitness(chromosome, X_train, X_val, y_train, y_val, model_type):
    target_type = type_of_target(y_train)

    try:
        if model_type == "random_forest":
            model_cls = RandomForestClassifier if target_type in ["binary", "multiclass"] else RandomForestRegressor
            model = model_cls(
                n_estimators=int(chromosome["n_estimators"]),
                max_depth=int(chromosome["max_depth"]),
                min_samples_split=int(chromosome["min_samples_split"]),
                min_samples_leaf=int(chromosome["min_samples_leaf"]),
                max_features=float(chromosome["max_features"]),
                random_state=42
            )

        elif model_type == "svm":
            if target_type not in ["binary", "multiclass"]:
                return float('-inf'), None, None
            model = SVC(
                C=chromosome["C"],
                gamma=chromosome["gamma"],
                tol=chromosome["tol"],
                probability=True
            )

        elif model_type == "neural_network":
            layer_count = int(chromosome["hidden_layer_sizes"])
            layer_size = int(chromosome["layer_size"])
            hidden_layers = tuple([layer_size] * layer_count)

            model_cls = MLPClassifier if target_type in ["binary", "multiclass"] else MLPRegressor
            model = model_cls(
                hidden_layer_sizes=hidden_layers,
                alpha=chromosome["alpha"],
                learning_rate_init=chromosome["learning_rate_init"],
                max_iter=500,
                random_state=42
            )

        else:
            return float('-inf'), None, None

        model.fit(X_train, y_train)
        predictions = model.predict(X_val)

        score = (
            accuracy_score(y_val, predictions)
            if target_type in ["binary", "multiclass"]
            else -mean_squared_error(y_val, predictions)
        )

        return score, chromosome, model

    except Exception as e:
        print(f"Fitness eval failed: {e}")
        return float('-inf'), None, None

def selection(population, fitnesses, tournament_size=3):
    selected = []
    for _ in range(len(population)):
        participants = random.sample(list(zip(population, fitnesses)), tournament_size)
        participants.sort(key=lambda x: x[1], reverse=True)
        selected.append(participants[0][0])
    return selected

def crossover(parent1, parent2):
    keys = list(parent1.keys())
    point = random.randint(1, len(keys) - 1)

    child1 = {}
    child2 = {}

    for i, key in enumerate(keys):
        if i < point:
            child1[key] = parent1[key]
            child2[key] = parent2[key]
        else:
            child1[key] = parent2[key]
            child2[key] = parent1[key]

    return child1, child2

def mutate(chromosome, model_type, mutation_rate=0.1):
    for key in chromosome:
        if random.random() < mutation_rate:
            r = HYPERPARAM_RANGES[model_type][key]
            if isinstance(r[0], float):
                chromosome[key] = random.uniform(*r)
            else:
                chromosome[key] = random.randint(*r)
    return chromosome

def run_ga(X, y, generations=10, population_size=10, model_type="random_forest", return_model=False):
    X_train, X_val, y_train, y_val = train_test_split(X, y, test_size=0.2, random_state=42)

    population = create_population(population_size, model_type)
    best_chromosome = None
    best_fitness = float('-inf')
    best_model = None
    best_params = None
    generation_scores = []

    for gen in range(generations):
        fitnesses = []
        models = []
        all_params = []

        for ind in population:
            fitness, params, model = evaluate_fitness(ind, X_train, X_val, y_train, y_val, model_type)
            fitnesses.append(fitness)
            models.append(model)
            all_params.append(params)

        max_fitness = max(fitnesses)
        max_index = fitnesses.index(max_fitness)

        if max_fitness > best_fitness:
            best_fitness = max_fitness
            best_chromosome = population[max_index]
            best_model = models[max_index]
            best_params = all_params[max_index]

        print(f"Generation {gen+1} | Best Fitness: {max_fitness:.4f} | Params: {population[max_index]}")
        generation_scores.append(max_fitness)

        selected = selection(population, fitnesses)
        next_population = []

        for i in range(0, population_size, 2):
            parent1 = selected[i]
            parent2 = selected[min(i + 1, population_size - 1)]
            child1, child2 = crossover(parent1, parent2)
            next_population.append(mutate(child1, model_type))
            next_population.append(mutate(child2, model_type))

        population = next_population[:population_size]

    if best_chromosome is None:
        print("❌ No valid solution found.")
    else:
        print("\n✅ Final Best Solution:")
        print(f"Best Fitness: {best_fitness:.4f}")
        print(f"Best Params: {best_params}")

    if return_model:
        return best_params, best_fitness, generation_scores, best_model

    return best_params, best_fitness, generation_scores
