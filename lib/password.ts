/*
  Password Strength Validation
  
  Enforces strong password requirements for security
*/

export function validatePassword(password: string): {
  valid: boolean
  errors: string[]
} {
  const errors: string[] = []
  
  // Minimum length requirement
  if (password.length < 14) {
    errors.push("Password must be at least 14 characters long")
  }
  
  // Uppercase letter requirement
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least 1 uppercase letter")
  }
  
  // Number requirement
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least 1 number")
  }
  
  // Special character requirement
  if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) {
    errors.push("Password must contain at least 1 special character")
  }
  
  return {
    valid: errors.length === 0,
    errors
  }
}

export function generateSecurePassword(length = 16): string {
  const lowercase = "abcdefghijklmnopqrstuvwxyz"
  const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ"
  const numbers = "0123456789"
  const special = "!@#$%^&*()_+-=[]{}|;:,.<>?"
  
  const allChars = lowercase + uppercase + numbers + special
  
  let password = ""
  
  // Ensure at least one character from each category
  password += lowercase[Math.floor(Math.random() * lowercase.length)]
  password += uppercase[Math.floor(Math.random() * uppercase.length)]
  password += numbers[Math.floor(Math.random() * numbers.length)]
  password += special[Math.floor(Math.random() * special.length)]
  
  // Fill the rest randomly
  for (let i = 4; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // Shuffle the password
  return password.split("").sort(() => Math.random() - 0.5).join("")
}
