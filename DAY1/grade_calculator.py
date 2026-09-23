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
    
    total = sum(marks.values())
    avg = total / len(marks)

    if avg >= 90:
        grade = "A+"
    elif avg >= 75:
        grade = "A"
    elif avg >= 60:
        grade = "B"
    elif avg >= 40:
        grade = "C"
    else:
        grade = "Fail"
    print(f"Total: {total} | Average: {avg:.2f} | Grade: {grade}")

dict_operations()
