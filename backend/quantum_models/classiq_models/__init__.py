"""
Classiq Quantum Models Package
"""

try:
    from .quantum_fire_cellular_automaton import QuantumFireCellularAutomaton
    from .quantum_random_walk_ember import QuantumRandomWalkEmber
    from .classiq_fire_spread import ClassiqFireSpread
    from .classiq_ember_dynamics import ClassiqEmberDynamics
    from .classiq_optimization import ClassiqOptimization

    __all__ = [
        'QuantumFireCellularAutomaton',
        'QuantumRandomWalkEmber',
        'ClassiqFireSpread',
        'ClassiqEmberDynamics',
        'ClassiqOptimization'
    ]
except ImportError as e:
    print(f"Warning: Could not import all Classiq models: {e}")
    __all__ = []
