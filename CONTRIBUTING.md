# Contributing to FREIP

Thank you for your interest in contributing to the Fractional Real Estate Investment Platform!

## Getting Started

1. Fork the repository
2. Clone your fork
3. Create a feature branch (`git checkout -b feature/AmazingFeature`)
4. Follow the coding standards
5. Commit your changes (`git commit -m 'Add AmazingFeature'`)
6. Push to the branch (`git push origin feature/AmazingFeature`)
7. Open a Pull Request

## Code Standards

### Backend (Node.js/Express)
- Use ES6+ syntax
- Follow ESLint configuration
- Write meaningful comments for complex logic
- Use async/await instead of callbacks
- Error handling with try-catch blocks

### Frontend (React/Next.js)
- Use functional components with hooks
- Follow component naming conventions (PascalCase)
- Use prop types or TypeScript for type safety
- Keep components small and focused
- Use custom hooks for shared logic

## Database Changes

1. Add migration files in `/database`
2. Update schema documentation
3. Test migrations thoroughly
4. Include rollback procedures

## Commit Message Format

```
[type]: [subject]

[body - optional]
```

Types:
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation
- `style`: Code style
- `refactor`: Code refactoring
- `test`: Testing
- `chore`: Build/dependency updates

## Pull Request Process

1. Update README if needed
2. Add tests for new features
3. Ensure all tests pass
4. Get approval from maintainers
5. Squash commits before merging

## Reporting Bugs

Include:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Error messages/logs
- Environment details

## Feature Requests

Describe:
- Use case
- Benefits
- Implementation approach (if known)
- Any related issues

## License

By contributing, you agree that your contributions will be licensed under the MIT License.
