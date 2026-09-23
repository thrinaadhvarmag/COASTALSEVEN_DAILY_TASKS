def largest(nums):
  largest=nums[0]
  for i in range(len(nums)):
    if nums[i] >largest:
      largest=nums[i]
  return largest
a=int(input("Enter the length of list: "))
nums=[]
for i in range(a):
  nums.append(int(input("enter a element: ")))
print("The largest number is : ",largest(nums))
