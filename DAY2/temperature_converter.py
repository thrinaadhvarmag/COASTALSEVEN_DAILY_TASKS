def celsius_to_fahrenheit(celsius):
    return (celsius * 9 / 5) + 32


def fahrenheit_to_celsius(fahrenheit):
    return (fahrenheit - 32) * 5 / 9


temperature = float(input("Enter temperature: "))
choice = input("Enter conversion (C-F or F-C): ").upper()

if choice == "C-F":

    result = celsius_to_fahrenheit(temperature)
    print("Temperature:", result, "°F")

elif choice == "F-C":

    result = fahrenheit_to_celsius(temperature)
    print("Temperature:", result, "°C")

else:
    print("Invalid choice")
