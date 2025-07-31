from classiq import create_model, qfunc, synthesize

@qfunc
def main():
    pass

qprog = synthesize(create_model(main))
print("Classiq is working correctly!")