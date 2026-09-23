def list_operations(nums):
    print("Original List:", nums)
    print("Sorted List:", sorted(nums))
    print("Max:", max(nums))
    print("Min:", min(nums))
    print("Sum:", sum(nums))
    print("Reversed:", nums[::-1])
a=int(input("Enter the number of elements in the list: "))
nums=[]
for i in range(a):
    nums.append(int(input("Enter an element: ")))
list_operations(nums)
