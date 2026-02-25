# Contribution Guidelines

Welcome to **osu! Collab Tools**! We're excited that you're interested in contributing to our project. This guide will help you understand how to effectively contribute and ensure a smooth collaboration process.

## Table of Contents

- [Ways to Contribute](#ways-to-contribute)
- [Pull Request Guidelines](#pull-request-guidelines)
- [Issue Guidelines](#issue-guidelines)
- [Code Style and Best Practices](#code-style-and-best-practices)
- [AI Usage Policy](#ai-usage-policy)

## Ways to Contribute

There are many ways to contribute to this project:

- **Reporting bugs**: Help us identify and fix issues by creating detailed bug reports
- **Suggesting features**: Share your ideas for new features or improvements
- **Improving documentation**: Enhance our documentation to make it clearer and more comprehensive
- **Submitting code**: Contribute directly by writing code and submitting pull requests
- **Reviewing PRs**: Help review and provide feedback on other contributors' pull requests
- **Translating**: Assist with localizing the project for different languages [on Crowdin](https://crowdin.com/project/osu-collab-tools)

## Pull Request Guidelines

To ensure a smooth review process and maintain code quality, please follow these guidelines when submitting pull requests:

### 1. Dependency Management

- **Be cautious with dependency version changes**: Only update dependencies when necessary and ensure compatibility with existing code
- **Document any dependency changes**: Clearly explain why a dependency update is needed

### 2. CI Status

- **Monitor CI status**: Ensure all tests pass before requesting review
- **Address any CI failures**: Fix any issues that cause CI to fail

### 3. Git History

- **Keep git history clean**: Avoid unnecessary merges or messy commit histories
- **Write meaningful commit messages**: Clearly describe what each commit does
- **Squash related commits**: Combine multiple small commits into logical units

This project uses a specified format of commit message like `category(module): changes`:

```text
chore(avatar): fix typo
```

### 4. TypeScript Usage

- **Strictly use TypeScript**: Except some config files (like `postcss.config.mjs`)
- **Maintain type safety**: Use proper types and interfaces
- **Avoid `any` type**: Only use `any` when absolutely necessary and document why

### 5. Testing

- **Test in local browser**: Ensure your changes work correctly in local browser testing
- **Test across browsers**: Respect compatibility across different browsers

Although we haven't set up benchmark tests yet, it's important to be aware of performance, which affects user experience to some extent.

### 6. Styling

- **Prefer TailwindCSS**: Use TailwindCSS for styling instead of global CSS
- **Follow design guidelines**: Maintain consistency with the project's design system, such as primary color constants

### 7. Component Usage

- **Reuse existing components**: Components under `components` are preferred
- **Use shadcn/ui for new components**: It's convenient to use the official CLI to add components:

  ```bash
  npx shadcn@latest add [component-name]
  ```

The output component code could be different from that on shadcn's document page. In this case, you can choose one by your preference.

### 8. Backend Dependencies

- **Avoid backend requirements**: Remember this is primarily a frontend-focused project
- **Use client-side solutions**: Where possible, implement functionality on the client side

### 9. Cross-Browser Compatibility

- **Test across platforms**: Ensure your changes work on different browsers and operating systems
- **Consider performance**: Optimize for different device capabilities

### 10. Documentation

- **Update documentation**: For any behavioral changes, update the documentation in the `app/docs` directory
- **Add doc comments**: For major functions and interfaces, include JSDoc comments

### 11. Localization

- **Consider string localization**: During development, be mindful of string localization
- **Add English translations**: You can start by adding English string translations

## Issue Guidelines

When creating issues or PRs:

- **Search existing issues**: Check if your issue or idea has already been discussed
- **Reference forum posts**: Feel free to post good proposals from the osu! forums here
- **Be descriptive**: Provide clear and detailed information about your issue or feature request
- **Include reproduction steps**: For bugs, include steps to reproduce the issue
- **Add context**: Explain why the issue is important or how the feature would benefit the project

## Code Style and Best Practices

- **Follow existing patterns**: Match the code style and patterns used in the project
- **Keep code clean**: Write clear, concise, and maintainable code
- **Use meaningful variable names**: Choose descriptive names for variables and functions
- **Limit file size**: Keep files under 500 lines of code where possible
- **Modularize code**: Break large components into smaller, reusable pieces

## AI Usage Policy

- **AI is allowed**: You may use AI tools to assist with development
- **Follow guidelines**: Ensure AI-generated code follows all the guidelines in this document
- **Human review required**: All AI-generated code must be manually reviewed and tested

---

Thank you for your interest in contributing to osu! Collab Tools! Your contributions help make this project better for everyone in the osu! community. If you have any questions, feel free to reach out to the maintainers.
