def dict_operations():
    marks = {}
    print("Enter subjects and marks. Type 'exit' as the subject to finish.\n")
    
    while True:
        subject = input("Enter subject name (or 'exit'): ").strip()
        if subject.lower() == 'exit':
            break
            
        
        while True:
            score_input = input(f"Enter marks for {subject}: ").strip()
            try:
                score = int(score_input)
                break  
            except ValueError:
                print("Invalid input. Please enter a valid integer for marks.")
                
        marks[subject] = score

    if not marks:
        print("\nNo data entered. Cannot perform operations.")
        return

    print("\n--- Results ---")
    print("All subjects:", list(marks.keys()))
    print("All marks:", list(marks.values()))
    
    total = sum(marks.values())
    avg = total / len(marks)
    print(f"Total: {total} | Average: {avg:.2f}")

dict_operations()
