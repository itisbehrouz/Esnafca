import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

void main() {
  testWidgets('Smoke test Flutter test framework', (WidgetTester tester) async {
    await tester.pumpWidget(
      const MaterialApp(
        home: Scaffold(
          body: Center(child: Text('Esnafça Mobile')),
        ),
      ),
    );

    expect(find.text('Esnafça Mobile'), findsOneWidget);
  });
}
