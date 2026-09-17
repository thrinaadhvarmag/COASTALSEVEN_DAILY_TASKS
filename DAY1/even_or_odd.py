def check_even_odd():
    print("Enter numbers to check. Type 'exit' to stop the program.")
    
    while True:
        user_input = input("Enter a number (or 'exit'): ").strip().lower()
        if user_input == 'exit':
            print("Program terminated.")
            break
        try:
            number = int(user_input)
            if number % 2 == 0:
                print(f"{number} is Even.")
            else:
                print(f"{number} is Odd.")
        except ValueError:
            print("Invalid input. Please enter a valid integer or 'exit'.")
check_even_odd()
